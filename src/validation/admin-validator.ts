import { body } from "express-validator";

const validateDuplicateTemplate = () => {
    return [ body("templateId").isInt() ];
}

const validateCreateQuestion = () => {
    return [
        body("text").isString(),
        body("choices").isArray(),
        body("templateId").if((t: any) => t.exists()).isInt(),
    ];
}

const validateDuplicateQuestion = () => {
    return [
        body("questionId").isInt(),
        body("templateId").if((t: any) => t.exists()).isInt(),
    ]
}

const validateEditQuestion = () => {
    return [
        body("questionId").isInt(),
        body("text").isString(),
        body("choices").isArray(),
    ];
}

const validateAssociateQuestionToTemplate = () => {
    return [
        body("questionId").isInt(),
        body("templateId").isInt(),
        body("qIndex").isInt(),
    ];
}

const validateDeleteQuizTemplate = () => {
    return [
        body("templateId").isInt(),
        body("deleteReferences").if((dr: any) => dr.exists()).isBoolean(),
    ];
}

const validateDeleteQuestion = () => {
    return [ body("questionId").isInt() ];
}

const validateRemoveQuestionFromTemplate = () => {
    return [ 
        body("templateId").isInt(),
        body("questionId").isInt(),
    ];
}

export {
    validateDuplicateTemplate,
    validateCreateQuestion,
    validateDuplicateQuestion,
    validateAssociateQuestionToTemplate,
    validateEditQuestion,
    validateDeleteQuizTemplate,
    validateDeleteQuestion,
    validateRemoveQuestionFromTemplate,
};