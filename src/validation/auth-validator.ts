import { checkSchema } from "express-validator";

/**
 * Validates the parameters given for the
 * registration of a Church
 */
function validateLogin() {
    return checkSchema({
        "email": {
            isEmail: true,
        },
        "password": {
            isString: true,
        },
    });
}

export {
    validateLogin,
}