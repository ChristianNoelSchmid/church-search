import { Request, Response } from 'express';
import { prisma } from '../client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { requireAuthorization } from '../middleware/auth';
import { Church, Individual, User, UserType } from '@prisma/client';
import { getGeocodeLocation } from '../services/geocode';

// #region Exported Functions
/**
 * Retrieves a single user with the given Id, found in the Request params
 */
const getUser = async (req: Request, res: Response, next: any) => {
    const user = await prisma.user.findFirst({
        where: { id: req.params.userId },
        select: {
            userType: true,
            church: true,
            indiv: true,
            passwordHash: false,
        },
    });

    if(user) {
        return res.status(200).json(user);
    } else {
        return res.status(400).json({ msg: "User with the given id not found" });
    }
}

/**
 * Creates an Individual User, using the Request body json
 * @returns A json result of the new User, with it's Individual info
 */
const createIndivUser = async (req: Request, res: Response, next: any) => {
    // If the User already exists return BadRequest
    if(await prisma.user.findFirst({ 
        where: { OR: [ 
            { email: req.body.user.email },
            { replacementEmail: req.body.user.email },
        ]}
    }) != null) {
        res.status(400).json(`A user with the email ${req.body.user.email} already exists.`);
        return;
    }

    const emailRoute = _generateEmailRoute();

    // Create the User, and the associated Individual
    const user = await prisma.user.create({
        data: {
            email: req.body.user.email,
            passwordHash: await _hashPassword(req.body.user.password),
            userType: UserType.Individual,
            aboutMe: req.body.user.aboutMe,
            confirmedEmailRoute: emailRoute,

            indiv: { create: {
                firstName: req.body.indiv.firstName,
                lastName: req.body.indiv.lastName,
            } }
        },
        include: { indiv: true, },
    });

    // Return a requery of the user with the individual info included
    res.status(201).json({ user });
}

/**
 * Creates a Church User, using the Request body json
 * @returns A json result of the new User, with it's Church info
 */
const createChurchUser = async (req: Request, res: Response, next: any) => {
    // If the User already exists return BadRequest
    if(
        await prisma.user.findFirst({ 
            where: { OR: [
                { email: req.body.user.email },
                { replacementEmail: req.body.user.email },
            ]}
        }) != null)
    {
        res.status(400).json(`A user with the email ${req.body.user.email} already exists.`);
        return;
    }

    const church = req.body.church;

    // Generate the email confirmation route
    const emailRoute = _generateEmailRoute();

    // Generate the address' latitude and longitude
    const loc = await getGeocodeLocation(church, res);

    if(loc == null) {
        res.status(400).send("Could not find given address.");
    } else {
        // Create the User, and the associated Church
        let user = await prisma.user.create({
            data: {
                email: req.body.user.email,
                replacementEmail: req.body.user.email,
                passwordHash: await _hashPassword(req.body.user.password),
                userType: UserType.Church,
                aboutMe: req.body.user.aboutMe,
                confirmedEmailRoute: emailRoute,
                
                church: { create: {
                    name: req.body.church.name,
                    city: req.body.church.city,
                    state: req.body.church.state,
                    zipCode: req.body.church.zipCode,
                    address: req.body.church.address,
                    locationLat: loc.lat,
                    locationLong: loc.lng
                }}
            },
            include: { church: true, },
        });

        // If there is a Quiz cookie that exists, assign it to the
        // new User
        /* if(req.cookies.quiz) {
            await prisma.quiz.create({
                data: {
                    answers: req.cookies.quiz, 
                }
            })
        }*/

        
        // Return a requery of the user with the church info included
        res.status(201).json({ user });
    }
}

const confirmEmail = async (req: Request, res: Response, next: any) => {
    const user = await prisma.user.findFirst({
        where: { confirmedEmailRoute: req.params.emailRoute },
    });

    if(user == null) {
        return res.status(401).send("Account not found");
    } else if(user.replacementEmail != null) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: user.replacementEmail,
                replacementEmail: null,
                confirmedEmailRoute: null,
                confirmedEmail: true,
            }
        })
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                confirmedEmailRoute: null, 
                confirmedEmail: true, 
            }
        });
    }
    
    return res.status(200).send("Account confirmed - thanks!");
}

const updateUserEmail = async (req: Request, res: Response, next: any) => {
    requireAuthorization(req, res, async () => {
        try {
            const user = await prisma.user.findFirst({
                where: { OR: [
                    { email: req.body.email }, 
                    { replacementEmail: req.body.email },
                ]}
            });

            if(user != null) {
                return res.status(400).send("Email already taken.");
            }

            const emailRoute = _generateEmailRoute();

            await prisma.user.update({
                where: { id: req.userId },
                data: {
                    replacementEmail: req.body.email,
                    confirmedEmail: false,
                    confirmedEmailRoute: emailRoute,
                }
            });

            return res.status(200).send("Updated. Please confirm email!");
        } catch(error) { return next(error); }
    });
}

const updateUserPassword = async(req: Request, res: Response, next: any) => {
    requireAuthorization(req, res, async() => {
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { passwordHash: await _hashPassword(req.body.password) }
        });  
        return res.status(200).send("Password updated.");
    });
}

/**
 * Updates the authorized Individual User's information,
 * based on the parameters given in the Request.
 */
const updateUser = async (req: Request, res: Response, next: any) => {
    requireAuthorization(req, res, async () => {
        const user = await prisma.user.findFirst({
            where: { id: req.userId },
            include: { indiv: true, church: true }
        });

        if(user) {
            if(user.userType == UserType.Individual) 
                await _updateIndividual(user, req, res);
            else
                await _updateChurch(user, req, res);
        } else {
            res.status(500).send("An error has occured. Please try again later.");
        }
    });
};
// #endregion Exported Functions

// #region Private Functions
// Hashes and salts the given password
const _hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10; 
    const hashedPassword = await bcrypt.hash(password, saltRounds); 
    return hashedPassword;
};

// Generates a unique email route when a user must
// confirm their email
const _generateEmailRoute = () => randomUUID();

// Updates the authorized Individual with the info given in the request
const _updateIndividual = async (
    user: User & { indiv: Individual | null, church: Church | null }, 
    req: Request, res: Response
) => {
    
    // Retrieve the data pertaining to the User Individual,
    // either from the request body, or the User Individual itself
    const userData = {
        aboutMe: req.body.aboutMe ?? user?.aboutMe,
        firstName: req.body.firstName ?? user?.indiv?.firstName,
        lastName: req.body.lastName ?? user?.indiv?.lastName,
    }

    // Update the User
    await prisma.user.update({
        where: { id: req.userId },
        data: {
            aboutMe: userData.aboutMe,
        },
    }); 
    // Update the Individual
    await prisma.individual.update({
        where: { userId: req.userId },
        data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
        }
    });

    res.status(200).send("Updated");
}

// Updates the authorized Church with the info given in the request
const _updateChurch = async (
    user: User & { indiv: Individual | null, church: Church | null }, 
    req: Request, res: Response
) => {
    // Retrieve the data pertaining to the User Church,
    // either from the request body, or the User Church itself
    const userData = {
        aboutMe: req.body.aboutMe ?? user?.aboutMe,
        name: req.body.name ?? user?.church?.name,
        address: req.body.address?? user?.church?.address,
        city: req.body.city ?? user?.church?.city,
        state: req.body.state ?? user?.church?.state,
        zipCode: req.body.zipCode ?? user?.church?.zipCode,
    };

    // Get the geocode location of the new address
    const loc = await getGeocodeLocation(userData, res);

    // If the location was not found, do not update the Church
    // and inform the client
    if(loc == null) {
        res.status(400).send("Address not found");
    } else {
        // Update the User
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                aboutMe: userData.aboutMe,
            },
        }); 
        // Update the Church
        await prisma.church.update({
            where: { userId: req.userId },
            data: {
                name: userData.name,
                address: userData.address,
                city: userData.city,
                state: userData.state,
                zipCode: userData.zipCode,
                locationLat: loc.lat,
                locationLong: loc.lng,
            }
        });
    
        res.status(200).send("Updated");
        return;
    }
}
// #endregion Private Functions

export { 
    getUser,
    createIndivUser,
    createChurchUser,
    confirmEmail,
    updateUser,
    updateUserEmail,
    updateUserPassword,
};

    

