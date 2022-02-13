import supertest from 'supertest';
import { app } from '../app';
import { prisma } from '../client';
import { Individual, User } from '@prisma/client';

let request = supertest(app);

describe('Quiz Endpoints', () => {
    test("sanity check", () => expect(1+1).toBeTruthy());
});
