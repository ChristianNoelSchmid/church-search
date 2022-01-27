import { checkSchema } from "express-validator";

/**
 * Validates the parameters given for the
 * registration of a Church
 */
function validateAddAnswer() {
    return checkSchema({
        "answer": {
            isInt: true,
            errorMessage: "Please supply an integer answer."
        },
        "questionId": {
            isString: true,
            errorMessage: "Please supply a questionId."
        },
    });
}

export {
    validateAddAnswer
}