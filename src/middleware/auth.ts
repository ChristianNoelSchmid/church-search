import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const config = process.env;

const verifyToken = (req: Request, res: Response, next: any) => {
    const token = 
        req.body.token || req.query.token || req.headers['x-access-token'] || req.headers['authorization'];

    if(!token) {
        return next();
    }

    if(config.TOKEN_KEY == undefined)
        throw new TokenKeyNotDefinedError();

    try {  
        const decoded = jwt.verify(token, config.TOKEN_KEY);
        console.log(decoded);
        req.user_id = decoded;
    } catch(error) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};

// #region Errors
class TokenKeyNotDefinedError extends Error { }
// #endregion

export {
    verifyToken,
    TokenKeyNotDefinedError,
};