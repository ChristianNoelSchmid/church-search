import { JwtPayload } from 'jsonwebtoken';
import { prisma } from './prisma/client';

declare global {
    namespace Express {
        export interface Request {
            user_id: String | JwtPayload;
            get user(): User | null;
        }
    }
}