import express, { Request, Response } from 'express';

import * as adminValidator from '../validation/admin-validator';
import * as adminController from '../controllers/admin-controller';
import { validate } from '../validation/validate';

const adminRouter = express.Router();
