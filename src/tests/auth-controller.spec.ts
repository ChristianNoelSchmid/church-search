import supertest, { SuperTest, Test } from 'supertest';
import { app } from '../app';
import { prisma } from '../client';
import { Individual, User } from '@prisma/client';

let request = supertest(app);

let user: User & { indiv: Individual | undefined };

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        // Create the User
        const res = await request.post('/users/create/indiv').send({
            user: { email: "hamilton@mail.com", password: "password", aboutMe: "I'm a founding father!" },
            indiv: { firstName: "Alexander", lastName: "Hamilton" },
        });

        user = res.body.user;
    });
    test('POST login with valid credentials should result in a 200: return accessToken', async() => {
        const loginData = { email: 'hamilton@mail.com', password: 'password' };

        const res = await request.post('/auth/login').send(loginData);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("accessToken");

        console.log(res.headers);

        expect(res.headers["set-cookie"]
            .some((h: string) => h.includes("refreshToken")))
            .toBeTruthy();
    });
    afterAll(async () => {
        if(user) {
            // After testing, delete the test User
            await prisma.user.delete({ where: { id: user.id } });
        }
    });
});
