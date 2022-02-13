import { Role } from '@prisma/client';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../client';

const config = process.env;

/**
 * Verifies that the given JWT access token is valid to a particular User,
 * and not expired. Upon doing so, assigns the User's id to the Request
 * @param req the request object
 * @param res the response object
 */
const verifyToken = async (req: Request, res: Response, next: any) => {
    // Retrieve the access token
    let token = req.body.token || req.query.token;

    if(!token) {
        token = req.headers['authorization']?.split(' ')[1];
        if(!token) return next();
    }

    if(config.TOKEN_KEY == undefined)
        throw new TokenKeyNotDefinedError();

    // Attempt to decode the JWT, returning a 401 error if it can't be
    try {  
        const decoded = jwt.verify(token, config.TOKEN_KEY) as any;
        req.userId = decoded.userId;
        const user = await prisma.user.findFirst({
            where: { id: req.userId }
        });

        // If JWT verification is successful, but the user isn't found, a server
        // error has occured
        if(user == null) {
            return res.status(500).send("Server Error. Please try again later.");
        } else {
            req.user = user;
        }
    } catch(error) {
        res.status(401).send("Invalid Token. Please try refresh, or login again.");
        return next(error);
    }
    return next();
};

const requireAuthorization = (role: Role, req: Request, res: Response, fn: () => any) => {
    // If the user is not logged in, or admin is required and the user is
    // not admin, send a 401
    if(!req.userId || (req.user?.role != role)) {
        res.status(401).send("Authorization required. Please log in.");
    } else {
        fn();
    }
}

// #region Errors
/**
 * Thrown when environment variables do not assign a
 * TOKEN_KEY value for JWT verification.
 */
class TokenKeyNotDefinedError extends Error { }
// #endregion

export {
    verifyToken,
    requireAuthorization,
    TokenKeyNotDefinedError,
};