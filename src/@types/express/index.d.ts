import { RequestHeaderFieldsTooLarge } from 'http-errors';
import { JwtPayload } from 'jsonwebtoken';

import { User } from '.prisma/client';

declare global {
    namespace Express {
        export interface Request {
            userId: string | undefined;
            user: User | undefined;
        }
    }
}
