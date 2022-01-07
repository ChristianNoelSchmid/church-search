import express, { Application, Request, Response } from "express";
import createError from 'http-errors';
import logger from "morgan";
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { verifyToken } from './middleware/auth';
import { authRouter } from './routes/auth-router';
import { userRouter } from './routes/user-router';
import { quizRouter } from './routes/quiz-router';

dotenv.config();

const app: Application = express();

// Body parsing Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(verifyToken);

// Routing Middleware
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/quiz', quizRouter);

// catch 404 and forward to error handler
app.use(function(_req: Request, res: Response, next: any) {
    next(createError(404));
});

// error handler
app.use(function(err: any, req: Request, res: Response) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500).json({msg: "an error has occurred"});
});

export { app }