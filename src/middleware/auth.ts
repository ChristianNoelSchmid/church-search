import { UserType } from '@prisma/client';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ReadableStreamBYOBRequest } from 'stream/web';
import { isFunction } from 'util';
import { prisma } from '../client';

const config = process.env;

/**
 * Verifies that the given JWT access token is valid to a particular User,
 * and not expired. Upon doing so, assigns the User's id to the Request
 * @param req the request object
 * @param res the response object
 */
const verifyToken = (req: Request, res: Response, next: any) => {
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
    } catch(error) {
        res.status(401).send("Invalid Token. Please try refresh, or login again.");
        return next(error);
    }
    return next();
};

const requireAuthorization = (req: Request, res: Response, fn: () => any) => {
    if(!req.userId) {
        return res.status(401).send("Authorization required. Please log in.");
    } else {
        return fn();
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