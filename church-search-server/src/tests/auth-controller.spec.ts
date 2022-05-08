import supertest from 'supertest';
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

        user = res.body;
    });
    test('POST /auth/login login with valid credentials should result in a 200: return accessToken', async() => {
        const loginData = { email: 'hamilton@mail.com', password: 'password' };

        // Login
        const res = await request.post('/auth/login').send(loginData);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined;

        // Check the refreshToken cookie value
        refreshToken = res.headers["set-cookie"]
            .find((h: string) => h.includes("refreshToken"));
        expect(refreshToken).not.toBeUndefined();
    });
    test('POST /auth/refresh with valid refresh token returns OK with new accessToken', async () => {
        // Set the refreshToken cookie value
        const res = await request.post('/auth/refresh')
            .set("Cookie", refreshToken);
        expect(res.status).toBe(200);

        // A new token should be generated
        expect(res.body).toBeDefined();
        refreshToken = res.headers["set-cookie"]
            .find((h: string) => h.includes("refreshToken"));

    });
    test('POST /auth/refresh with used refresh token revokes current and returns 400', async () => {
        // cache the current refreshToken, then refresh
        const previousRefreshToken = refreshToken;
        let res = await request.post('/auth/refresh')
            .set("Cookie", refreshToken);

        refreshToken = res.headers["set-cookie"]
            .find((h: string) => h.includes("refreshToken"));

        // Refresh again with the previous token, expecting 400
        res = await request.post('/auth/refresh')
            .set("Cookie", previousRefreshToken);
        expect(res.status).toBe(400); 
        expect(res.body).toStrictEqual({});

        // Refresh with the new token, expecting 400
        await request.post('/auth/refresh')
            .set("Cookie", refreshToken);
        expect(res.status).toBe(400);
        expect(res.body).not.toHaveProperty("accessToken");
    });
    test('POST /auth/logout with refresh token revokes the refreshToken and invalidates it.', async () => { 
        // Login again and retrieve a new refreshToken
        let res = await request.post('/auth/login')
            .send({ email: "hamilton@mail.com", password: "password" });
        refreshToken = res.headers['set-cookie']
            .find((h: string) => h.includes("refreshToken")); 

        await request.put('/auth/logout');

        res = await request.put('/auth/logout')
            .set("Cookie", refreshToken);

        expect(res.status).toBe(200);

        const token = await prisma.refreshToken.findFirst({
            where: { token: refreshToken.split('=')[1].split(';')[0] }
        });

        expect(token?.revoked).not.toBeNull();

        const newToken = res.headers["set-cookie"]
            .find((h: string) => h.includes("refreshToken"))
            .split('=')[1].split(';')[0];
        expect(newToken).toBe("");    

        // Finally, attempt to refresh with the revoked refreshToken, which
        // should result in a 400 error
        res = await request.post('/auth/refresh')
            .set("Cookie", refreshToken);

        expect(res.status).toBe(400);
    });
    afterAll(async () => {
        // After testing, delete the test User
        await prisma.user.deleteMany({ where: { email: "hamilton@mail.com" } })
        await prisma.refreshToken.deleteMany();
    });
});
