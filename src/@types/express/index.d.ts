import { RequestHeaderFieldsTooLarge } from 'http-errors';
import { JwtPayload } from 'jsonwebtoken';

import { User } from '.prisma/client';
import { prisma } from '../../client';

declare global {
    namespace Express {
        export interface Request {
            userId: string | undefined;
            get user(): User | undefined;
        }
    }

    Request.prototype.user = async (): User => {
        if(this.userId == null)
            return null;

        return await prisma.user.findFirst({
            where: { id: userId }
        });
    };
}
