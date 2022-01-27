import { checkSchema } from "express-validator";

/**
 * Validates the parameters given for the
 * registration of a Church
 */
function validateLogin() {
    return checkSchema({
        "email": {
            isEmail: true,
            errorMessage: "Please supply a valid email"
        },
        "password": {
            isString: true,
            errorMessage: "Please supply a password"
        },
    });
}

export {
    validateLogin,
}