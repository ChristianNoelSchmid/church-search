import supertest, { SuperTest, Test } from 'supertest';
import { app } from '../app';
import { prisma } from '../client';
import { Individual, User } from '@prisma/client';

let request = supertest(app);

let user: User & { indiv: Individual | undefined };
let refreshToken: string = "";

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        // Create the User
        const res = await request.post('/users/create/indiv').send({
            user: { email: "hamilton@mail.com", password: "password", aboutMe: "I'm a founding father!" },
            indiv: { firstName: "Alexander", lastName: "Hamilton" },
        });

        user = res.body.user;
    });
    test('POST /auth/login login with valid credentials should result in a 200: return accessToken', async() => {
        const loginData = { email: 'hamilton@mail.com', password: 'password' };

        const res = await request.post('/auth/login').send(loginData);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("accessToken");

        refreshToken = res.headers["set-cookie"]
            .find((h: string) => h.includes("refreshToken"));
        expect(refreshToken).not.toBeUndefined();
    });
    test('POST /auth/refresh with valid refresh token returns OK with new accessToken', async () => {
        // The previous test will have already received a refreshToken
        const res = await request.post('/auth/refresh')
            .set("Cookie", refreshToken);
        expect(res.status).toBe(200);

        expect(res.body).toHaveProperty("accessToken");
        refreshToken = res.headers["set-cookie"]
            .find((h: string) => h.includes("refreshToken"));

    });
    test('POST /auth/refresh with used refresh token revokes current and returns 400', async () => {
        const previousRefreshToken = refreshToken;
        let res = await request.post('/auth/refresh')
            .set("Cookie", refreshToken);

        console.log(res.headers);

        refreshToken = res.headers["set-cookie"]
            .find((h: string) => h.includes("refreshToken"));

        res = await request.post('/auth/refresh')
            .set("Cookie", previousRefreshToken);
        expect(res.status).toBe(400); 
        expect(res.body).not.toHaveProperty("accessToken");

        await request.post('/auth/refresh')
            .set("Cookie", refreshToken);
        expect(res.status).toBe(400);
        expect(res.body).not.toHaveProperty("accessToken");
    });
    afterAll(async () => {
        if(user) {
            // After testing, delete the test User
            await prisma.user.delete({ where: { id: user.id } })
            await prisma.refreshToken.deleteMany({
                where: { token: { not: "" }}
            });
        }
    });
});
