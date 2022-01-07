import { Request, Response } from 'express';
import { prisma } from '../client';
import bcrypt from 'bcrypt';
import crypto, { randomUUID } from 'crypto';
import { requireAuthorization } from '../middleware/auth';
import { UserType } from '@prisma/client';

/**
 * Retrieves a single user with the given Id, found in the Request params
 */
const getUser = async (req: Request, res: Response, next: any) => {
    try {
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
    }   catch(error) { next(error); }
}

/**
 * Creates an Individual User, using the Request body json
 * @returns A json result of the new User, with it's Individual info
 */
const createIndivUser = async (req: Request, res: Response, next: any) => {
    try {
        // If the User already exists return BadRequest
        if(await prisma.user.findFirst({ 
            where: { email: req.body.user.email }}
            ) != null) {
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
    }   catch(error) { next(error); }
}

/**
 * Creates a Church User, using the Request body json
 * @returns A json result of the new User, with it's Church info
 */
const createChurchUser = async (req: Request, res: Response, next: any) => {
    try {
        // If the User already exists return BadRequest
        if(await prisma.user.findFirst({ 
            where: { email: req.body.user.email }}
            ) != null) {
            res.status(400).json(`A user with the email ${req.body.user.email} already exists.`);
            return;
        }

        const emailRoute = _generateEmailRoute();

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
                    address: req.body.church.address,
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
        return res.status(201).json({ user });
    } catch (error) { next(error); }
}

const confirmEmail = async (req: Request, res: Response, next: any) => {
    try {
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
    } catch(error) { return next(error); }
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

const updateIndivUser = async (req: Request, res: Response, next: any) => {
    if(!req.userId)
        return res.status(400).send("Authentication required. Please sign in.");
    try {
        // Update the Individual
        await prisma.individual.update({
            where: { userId: req.userId },
            data: {
                firstName: req.body.indiv.firstName,
                lastName: req.body.indiv.lastName,
            },
        }); 
 
        return res.status(200);
    }   catch(error) { next(error); }
};

const updateChurchUser = async (req: Request, res: Response, next: any) => {
    if(req.userId == null)
            return res.status(400).send("Authentication required. Please sign in.");
    try {
        // Update the Church
        await prisma.church.update({
            where: { userId: req.userId },
            data: {
                name: req.body.church.name,
                address: req.body.church.address,
            },
        });

        return res.status(200);
    } catch(error) { next(error); }
};

const _hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10; 
    const hashedPassword = await bcrypt.hash(password, saltRounds); 
    return hashedPassword;
};

const _generateEmailRoute = (): string => randomUUID();

export { 
    getUser,
    createIndivUser,
    createChurchUser,
    confirmEmail,
    updateIndivUser,
    updateChurchUser,
    updateUserEmail,
};

