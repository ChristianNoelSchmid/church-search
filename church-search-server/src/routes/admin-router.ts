import express, { Request, Response } from 'express';

import * as adminValidator from '../validation/admin-validator';
import * as adminController from '../controllers/admin-controller';
import { validate } from '../validation/validate';

const adminRouter = express.Router();

// POST create new quiz template
adminRouter.post('/template/create', 
    async (req: Request, res: Response, next: any) => {
        try { await adminController.createQuizTemplate(req, res); }
        catch(error) { next(error); }
    }
);

// POST duplicate quiz template
adminRouter.post('/template/duplicate',
    adminValidator.validateDuplicateTemplate(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.duplicateQuizTemplate(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.post('/question/create',
    adminValidator.validateCreateQuestion(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.createNewQuestion(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.post('/question/duplicate',
    adminValidator.validateDuplicateQuestion(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.duplicateQuestion(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.put('/question/associate',
    adminValidator.validateAssociateQuestionToTemplate(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.associateQuestionToTemplate(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.put('/question/update',
    adminValidator.validateEditQuestion(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.editQuestion(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.delete('/template/delete',
    adminValidator.validateDeleteQuizTemplate(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.deleteQuizTemplate(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.delete('/question/delete',
    adminValidator.validateDeleteQuestion(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.deleteQuestion(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.put('/question/remove-from',
    adminValidator.validateRemoveQuestionFromTemplate(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.removeQuestionFromTemplate(req, res); }
        catch(error) { next(error); }
    }
)

export { adminRouter, }