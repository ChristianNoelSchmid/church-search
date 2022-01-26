import express, { Request, Response } from "express";
import * as searchController from '../controllers/search-controller';

const searchRouter = express.Router();

searchRouter.get("/churches", 
    async (req: Request, res: Response, next: any) =>
        await searchController.searchChurches(req, res, next)
);

export { searchRouter };