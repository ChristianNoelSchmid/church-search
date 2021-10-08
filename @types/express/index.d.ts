import { RequestHeaderFieldsTooLarge } from 'http-errors';
import { JwtPayload } from 'jsonwebtoken';

declare global {
    namespace Express {
        export interface Request {
            userId: string | null;
        }
    }
}
