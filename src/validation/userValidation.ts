import { body, checkSchema } from "express-validator";

/**
 * Validates the parameters given for getting
 * a unique User's information
 */
function validateGetUser() {
    return [
        body("userId").isInt()
    ];
}

/**
 * Validates the parameters given for updating
 * a User's email
 */
function validateUpdateEmail() {
    return [
        body("email").isEmail()
    ];
}

/**
 * Validates the parameters given for the
 * registration of a Church
 */
function validateRegisterChurch() {
    return checkSchema({
        "user.email": {
            isEmail: true,
        },
        "user.password": {
            isLength: { options: { min: 8 }},
            errorMessage: "Password must be at least 8 characters long." ,
        },
        "user.aboutMe": {
            isString: true,
        },
        "church.name": {
            isString: true,
        },
        "church.address": {
            isString: true
        }
    });
}

/**
 * Validates the parameters given for the
 * registration of an Individual
 */
function validateRegisterIndividual() {
    return checkSchema({
        "user.email": {
            isEmail: true,
        },
        "user.password": {
            isLength: { 
                options: { min: 8 }, 
                errorMessage: "Password must be at least 8 characters long." ,
            },
        },
        "user.aboutMe": {
            isString: true,
        },
        "indiv.firstName": {
            isString: true,
        },
        "indiv.lastName": {
            isString: true,
        },
    });
}

export { 
    validateGetUser,
    validateRegisterChurch,
    validateRegisterIndividual,
    validateUpdateEmail,
}