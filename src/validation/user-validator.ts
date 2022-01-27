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

function validateUpdatePassword() {
    return [body("password").isLength({ min: 8 })];
}

/**
 * Validates the parameters given for the
 * registration of a Church
 */
function validateRegisterChurch() {
    return checkSchema({
        "user.email": {
            isEmail: true,
            errorMessage: "Please provide a valid email"
        },
        "user.password": {
            isLength: { 
                options: { min: 8 },
                errorMessage: "Please provide a password at least 8 characters long." ,
            },
        },
        "user.aboutMe": {
            isString: true,
            errorMessage: "Please provide an aboutMe"
        },
        "church.name": {
            isString: true,
            errorMessage: "Please provide a name"
        },
        "church.address": {
            isString: true,
            errorMessage: "Please provide an address"
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
            errorMessage: "Please provide a valid email"
        },
        "user.password": {
            isLength: { 
                options: { min: 8 }, 
                errorMessage: "Please provide a password at least 8 characters long" ,
            },
        },
        "user.aboutMe": {
            isString: true,
            errorMessage: "Please provide an aboutMe"
        },
        "indiv.firstName": {
            isString: true,
            errorMessage: "Please provide a firstName"
        },
        "indiv.lastName": {
            isString: true,
            errorMessage: "Please provide a lastName."
        },
    });
}

export { 
    validateGetUser,
    validateRegisterChurch,
    validateRegisterIndividual,
    validateUpdateEmail,
    validateUpdatePassword,
}