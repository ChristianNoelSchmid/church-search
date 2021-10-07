import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../prisma/client';
import jwt from 'jsonwebtoken'
import { RefreshToken, User } from '@prisma/client';

// Create a new Individual User
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
                }}
            },
            include: { indiv: true, },
        });
        
        // Return a requery of the user with the individual info included
        res.status(201).json(user);
    } catch(error) { next(error); }
}

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
        const user = await prisma.user.create({
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

        const [accessToken, refreshToken] = [_generateAccessToken(user.id), (await _createRefreshToken(user, null, req.ip)).token];

        // Return a requery of the user with the church info included
        res.status(201).json({ user, accessToken, refreshToken });
    } catch (error) { next(error); }
}

const updateIndivUser = async (userId: string, req: Request, res: Response, next: any) => {
    try {
        // Update the Individual
        await prisma.individual.update({
            where: { userId: userId },
            data: {
                firstName: req.body.indiv.firstName,
                lastName: req.body.indiv.lastName,
            },
        }); 

        // Update the User
        const user = await prisma.user.update({
            where: { id: userId },
            data: { email: req.body.user.email, },
            include: { indiv: true, },
        });
        
        res.status(201).json(user);
    } catch(error) { next(error); }
};

const updateChurchUser = async (userId: string, req: Request, res: Response, next: any) => {
    try {
        // Update the Church
        await prisma.church.update({
            where: { userId: userId },
            data: {
                name: req.body.church.name,
                address: req.body.church.address,
            },
        });

        // Update the User
        const user = await prisma.user.update({
            where: { id: req.body.user.id, },
            data: { email: req.body.user.email, },
            include: { church: true, },
        }); 

        res.status(201).json(user);
    } catch(error) { next(error); }
};

// #region Private Functions
const _hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10; 
    const hashedPassword = await bcrypt.hash(password, saltRounds); 
    return hashedPassword;
};

const _generateAccessToken = (user_id: string): string => {
    if(process.env.TOKEN_KEY == undefined)
        throw "TOKEN_KEY env value not set!";

    const token = jwt.sign(
        { user_id }, process.env.TOKEN_KEY, {
            expiresIn: "5m"
        }
    );
        
    return token;
}

// Generates a new refresh token for a user, given a current refresh token
const _generateNewRefreshToken = async (token: string, ipAddress: string): Promise<string> => {
    const now = new Date();

    // Find the user who owns the given refresh token
    const user = await prisma.user.findFirst({
        where: { refreshToken: { 
            some: { token: token }
        } },

        // Only include the refresh token for the client
        // currently connecting
        include: { refreshToken: {
            where: { token: token }
        } },
    });

    // If that user was not found, return a user not found error
    if(user == null) 
        throw new UserNotFoundError();

    const currentToken = user.refreshToken[0];

    // If the token has already been revoked, the user's account may have
    // a security problem. Revoke it's decendent token to end the branch.
    if (currentToken.revoked) {
        await _revokeRefreshToken(currentToken, now);
        throw new RevokedTokenError();
    }

    // If the token is stale, the user needs to be revoked.
    // The user must log back in.
    if(now.getTime() > currentToken.expires.getTime()) {
        throw new StaleTokenError();
    }

    const newToken =  await _createRefreshToken(user, currentToken, ipAddress);
    return newToken.token;
}

const _revokeRefreshToken = async (currentToken: RefreshToken, now: Date) => {
    let replacementToken;
    while (currentToken?.replacementId != null) {
        replacementToken = await prisma.refreshToken.findFirst({
            where: { id: currentToken?.replacementId }
        });
    }
    if (replacementToken != null) {
        await prisma.refreshToken.update({
            where: { id: replacementToken.id },
            data: {
                revoked: now,
                revokedByIp: "server: duplicate refresh"
            }
        });
    }
}

const _createRefreshToken = async (user: User, currentToken: RefreshToken | null, ipAddress: string): Promise<RefreshToken> => {

    const now = new Date();
    const bytes = crypto.randomBytes(64).toString('base64');
    const newRefreshToken = await prisma.refreshToken.create({
        data: {
            token: bytes,
            expires: new Date(now.getTime() + (5 * 60000)), // add five minutes to now
            created: now,
            createdByIp: ipAddress,
            userId: user.id,
        },
    });
    if(currentToken != null) {
        await prisma.refreshToken.update({
            where: { id: currentToken.id },
            data: { 
                revoked: now,
                revokedByIp: ipAddress,
                replacementId: newRefreshToken.id
            }
        });
    }

    return newRefreshToken;
}
// #endregion

// #region Errors
class StaleTokenError extends Error { }
class RevokedTokenError extends Error { }
class UserNotFoundError extends Error { }
// #endregion

export { 
    createIndivUser,
    createChurchUser,
    updateIndivUser,
    updateChurchUser,
};

