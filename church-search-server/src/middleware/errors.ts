import { PrismaClientInitializationError, PrismaClientKnownRequestError, PrismaClientRustPanicError, PrismaClientUnknownRequestError, PrismaClientValidationError } from "@prisma/client/runtime";
import { Request, Response } from "express";

const handleErrors = (error: Error, req: Request, res: Response, next: any) => {
    if(error instanceof PrismaClientKnownRequestError ||
       error instanceof PrismaClientUnknownRequestError ||
       error instanceof PrismaClientRustPanicError ||
       error instanceof PrismaClientInitializationError ||
       error instanceof PrismaClientValidationError) {
            console.error(`PRISMA ERROR: ${error.name}: ${error.message}. ${error.stack}`);
            res.status(500).send("Database Error. Please try again later.");
    } else {
        console.error(`ERROR: ${error.name}\n${error.message}\n${error.stack}`)
        res.status(500).send("An error has occured. Please try again later.");
    }
}

export { 
    handleErrors, 
}