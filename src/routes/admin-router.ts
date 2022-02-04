import express, { Request, Response } from 'express';

import * as adminValidator from '../validation/admin-validator';
import * as adminController from '../controllers/admin-controller';
import { validate } from '../validation/validate';

const adminRouter = express.Router();

// POST create new quiz template
adminRouter.post('/admin/template/create', 
    async (req: Request, res: Response, next: any) => {
        try { await adminController.createQuizTemplate(req, res); }
        catch(error) { next(error); }
    }
);

// POST duplicate quiz template
adminRouter.post('/admin/template/duplicate',
    adminValidator.validateDuplicateTemplate(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.duplicateQuizTemplate(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.post('/admin/question/create',
    adminValidator.validateCreateQuestion(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.createNewQuestion(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.post('/admin/question/duplicate',
    adminValidator.validateDuplicateQuestion(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.duplicateQuestion(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.put('/admin/question/add-to',
    adminValidator.validateAssociateQuestionToTemplate(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.associateQuestionToTemplate(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.put('/admin/question/update',
    adminValidator.validateEditQuestion(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.editQuestion(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.delete('/admin/template/delete',
    adminValidator.validateDeleteQuizTemplate(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.deleteQuizTemplate(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.delete('/admin/question/delete',
    adminValidator.validateDeleteQuestion(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.deleteQuestion(req, res); }
        catch(error) { next(error); }
    }
);

adminRouter.put('/admin/question/remove-from',
    adminValidator.validateRemoveQuestionFromTemplate(), validate,
    async (req: Request, res: Response, next: any) => {
        try { await adminController.removeQuestionFromTemplate(req, res); }
        catch(error) { next(error); }
    }
)