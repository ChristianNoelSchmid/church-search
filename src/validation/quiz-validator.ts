import { checkSchema } from "express-validator";

/**
 * Validates the parameters given for the
 * registration of a Church
 */
function validateAddAnswer() {
    return checkSchema({
        "answer": {
            isInt: true,
        },
        "questionId": {
            isString: true,
        },
    });
}

export {
    validateAddAnswer
}