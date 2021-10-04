import express, { Application, Request, Response } from "express";
import createError from 'http-errors';
import logger from "morgan";

import { indexRouter } from './routes/index';

const app: Application = express();
const port = 3000;

// Body parsing Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing Middleware
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use((err: any, req: any, res: any, next: any) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
  
// Begin listening...
try {
    app.listen(port, () => {
        console.log(`Connected successfully on port ${port}`);
    });
} catch (error: any) {
    console.error(`Error occured: ${error.message}`);
}