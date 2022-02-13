import express, { Request, Response } from "express";
import * as searchController from '../controllers/search-controller';

const searchRouter = express.Router();

searchRouter.get("/churches", 
    async (req: Request, res: Response, next: any) => {
        try { await searchController.searchChurches(req, res, next); }
        catch(error) { next(error); }
    }
);

export { searchRouter };