import express, { Request, Response } from "express";
import { body, validationResult, header} from "express-validator";

import { searchChurches } from '../controllers/search-controller';

const searchRouter = express.Router();

searchRouter.get("/churches", 

    async (req: Request, res: Response, next: any) =>
        await searchChurches(req, res, next)
);

export { searchRouter };