import express, { Application, Request, Response } from "express";
import logger from "morgan";
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';

import { verifyToken } from './middleware/auth';
import { adminRouter } from './routes/admin-router';
import { authRouter } from './routes/auth-router';
import { userRouter } from './routes/user-router';
import { quizRouter } from './routes/quiz-router';
import { handleErrors } from "./middleware/errors";

dotenv.config();

const app: Application = express();

// Body parsing Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(verifyToken);

// Routing Middleware
app.use('/admin', adminRouter);
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/quiz', quizRouter);

// Error parsing Middleware
app.use(handleErrors);

// catch 404
app.use(function(_req: Request, res: Response, next: any) {
    return res.status(404).send("Not found");
});

export { app }