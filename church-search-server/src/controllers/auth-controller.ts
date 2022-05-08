import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import { RefreshToken, User } from '@prisma/client';

import { TokenKeyNotDefinedError } from '../middleware/auth';
import { prisma } from '../client';
import { sleep, UserAndAccessToken } from '../models';

// #region Exported Functions
/** 
 * Retrieves refresh token cookie, verifies it, and returns a new access token
 * and refresh token if the refresh token verifies.
 * If not, a specific error is thrown.
 */
const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
    try { 
        const currentRefreshToken = req.cookies['refreshToken'];
        if(currentRefreshToken == null) 
            return res.status(400).json('refreshToken cookie required to receive new access token.');
        
        const [accessToken, newRefreshToken] = await _checkAndGenTokens(currentRefreshToken, req.ip);
        res.cookie('refreshToken', newRefreshToken, { httpOnly: true });

        res.status(200).json(accessToken)
    } catch(error) {
        if(error instanceof UserNotFoundError) {
            return res.status(400).send("User did not match refresh token.");
        } else if(error instanceof RevokedTokenError) {
            return res.status(400).send("Revoked token error: please sign in again.");
        } else if(error instanceof StaleTokenError) {
            return res.status(400).send("Stale token error: please sign in again.");
        }
    }
}

const logout = async(req: Request, res: Response, next: any) => {
    await sleep(1000);
    const cookie = req.cookies['refreshToken'];
    const currentRefreshToken = await prisma.refreshToken.findFirst({
        where: { token: cookie },
    });

    if(currentRefreshToken != null)
        _revokeRefreshToken(currentRefreshToken, req.ip);

    res.clearCookie('refreshToken');
    return res.status(200).send();
}

const login = async(req: Request, res: Response, next: any) => {
    await sleep(1000);

    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
        where: { email: email },
        select: {
            indiv: true, church: true, 
            id: true, email: true, role: true, confirmedEmail: true, 
            replacementEmail: true, photoUrl: true, passwordHash: true,
            userType: true
        }
    }) as any;

    if(user != null) {
        if(await bcrypt.compare(password, user.passwordHash)) {
            const [accessToken, refreshToken] = [
                _generateAccessToken(user.id),
                await _generateRefreshToken(user, null, req.ip)
            ];

            user.accessToken = accessToken;
            if(user.passwordHash) delete user.passwordHash;

            res.cookie("refreshToken", refreshToken.token, { httpOnly: true });

            // Return the user, with the access token
            res.status(200).json(user as UserAndAccessToken);
            return;
        }
    }

    return res.status(400).send("Email/Password combination didn't match. Please try again."); 
}
// #endregion Exported Functions

// #region Private Functions
const _generateAccessToken = (userId: string): string => {
    if(process.env.TOKEN_KEY == undefined)
        throw new TokenKeyNotDefinedError("No token key for the environment is declared");

    const token = jwt.sign(
        { userId }, process.env.TOKEN_KEY, {
            expiresIn: "5m"
        }
    );
        
    return token;
}

const _generateRefreshToken = async (user: User, currentToken: RefreshToken | null, ipAddress: string): Promise<RefreshToken> => {

    const now = new Date();
    const bytes = crypto.randomBytes(64).toString('base64');

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const newRefreshToken = await prisma.refreshToken.create({
        data: {
            token: bytes,
            expires: expirationDate, // one week
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

// Generates a new access and refresh token for a user, given a current refresh token.
// Tests the given refresh token to ensure it is still valid.
const _checkAndGenTokens = async (refreshToken: string, ipAddress: string): Promise<[string, string]> => {
    const now = new Date();

    // Find the user who owns the given refresh token
    const user = await prisma.user.findFirst({
        where: { 
            refreshToken: { 
                some: { token: refreshToken }
            },
        },

        // Only include the current refresh token for the client
        // currently connecting
        include: { refreshToken: {
            where: { token: refreshToken }
        } },
    });

    // If that user was not found, return a user not found error
    if(user == null) 
        throw new UserNotFoundError();

    const currentToken = user.refreshToken[0];

    // If the token has already been revoked, the user's account may have
    // a security problem. Revoke it's decendent token to end the branch.
    if (currentToken.revoked) {
        await _revokeRefreshToken(currentToken, "server: duplicate refresh");
        throw new RevokedTokenError();
    }

    // If the token is stale, the user needs to be revoked.
    // The user must log back in.
    if(now.getTime() > currentToken.expires.getTime()) {
        throw new StaleTokenError();
    }

    const newToken =  await _generateRefreshToken(user, currentToken, ipAddress);
    return [
        _generateAccessToken(user.id), 
        newToken.token
    ];
}

const _revokeRefreshToken = async (currentToken: RefreshToken, ipAddress: string) => {

    let replacementToken: RefreshToken | null = currentToken;
    while (replacementToken?.replacementId != null) {
        replacementToken = await prisma.refreshToken.findFirst({
            where: { id: replacementToken.replacementId }
        });
    }
    if (replacementToken != null) {
        await prisma.refreshToken.update({
            where: { id: replacementToken.id },
            data: {
                revoked: new Date(),
                revokedByIp: ipAddress,
            }
        });
    }
}

// #endregion Private Functions

class UserNotFoundError extends Error { }
class StaleTokenError extends Error { }
class RevokedTokenError extends Error { }

export {
    refreshAccessToken,
    login,
    logout,
};