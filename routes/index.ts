import express from "express";

const indexRouter = express.Router();
indexRouter.get('/', (_req, res) => {
    res.json({ 
        msg: "Hello, index!",
        value: 64,
    });
});

export { indexRouter };