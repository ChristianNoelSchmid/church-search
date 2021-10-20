import { Request, Response } from 'express';
import { prisma } from '../client';
import bcrypt from 'bcrypt';
import { gmail_v1, google, GoogleApis } from 'googleapis';
import { GeneratedAPIs } from 'googleapis/build/src/apis';
import { gmail } from 'googleapis/build/src/apis/gmail';

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

        // Create the User, and the associated Individual
        const user = await prisma.user.create({
            data: {
                email: req.body.user.email,
                passwordHash: await _hashPassword(req.body.user.password),
                userType: 'Individual',

                indiv: { create: {
                    firstName: req.body.indiv.firstName,
                    lastName: req.body.indiv.lastName,
                } }
            },
            include: { indiv: true, },
        });

        const gmail = new gmail_v1.Gmail({ });
        gmail.users.messages.send()

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

        // Create the User, and the associated Church
        let user = await prisma.user.create({
            data: {
                email: req.body.user.email,
                passwordHash: await _hashPassword(req.body.user.password),
                userType: 'Church',
                
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
        res.status(201).json({ user });
    } catch (error) { next(error); }
}

const updateIndivUser = async (req: Request, res: Response, next: any) => {
    if(req.userId == undefined)
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

        // Update the User
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { email: req.body.user.email, },
            select: {
                indiv: true,
                passwordHash: false,
            }
        });
        
        return res.status(201).json(user);
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

        // Update the User
        const user = await prisma.user.update({
            where: { id: req.userId, },
            data: { email: req.body.user.email, },
            select: { 
                church: true,
                passwordHash: false,
            },
        }); 

        return res.status(201).json(user);
    } catch(error) { next(error); }
};

const _hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10; 
    const hashedPassword = await bcrypt.hash(password, saltRounds); 
    return hashedPassword;
};

export { 
    getUser,
    createIndivUser,
    createChurchUser,
    updateIndivUser,
    updateChurchUser,
};

