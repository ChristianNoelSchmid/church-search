import supertest, { SuperTest, Test } from 'supertest';
import { app } from '../app';
import { prisma } from '../client';
import { Church, Individual, User } from '@prisma/client';

let request = supertest(app);

let indivUser: User & { indiv: Individual, accessToken: string | undefined };
let churchUser: User & { church: Church, accessToken: string | undefined };

describe('User Endpoints', () => {
    beforeEach(async () => {
        // If the test Inidividual has been created, login prior to
        // every test
        if(indivUser && !indivUser.accessToken) {
            const loginData = { email: indivUser.email, password: "password" };
            const res = await request.post('/auth/login').send(loginData);
            indivUser.accessToken = res.body.accessToken;
        }
        // Some for Church
        if(churchUser && !churchUser.accessToken) {
            const loginData = { email: churchUser.email, password: "password" };
            const res = await request.post('/auth/login').send(loginData);
            churchUser.accessToken = res.body.accessToken;
        }
    })
    // #region Individual
    test('POST /users/create/indiv with a password with length < 8 should return a 400', async() => {
        const userIndiv = _userIndivRegisterData();
        userIndiv.user.password = "short";

        const res = await request.post('/users/create/indiv').send(userIndiv);
            expect(res.status).toBe(422); // 422 Status Code should be returned
            expect(
                await prisma.user.findFirst({ where: { email: userIndiv.user.email } })
            ).toBe(null); // The user should not have been created
    });
    test('POST users/create/indiv with appropriate values should return a 201: created new Individual', async() => {
        const userIndiv = _userIndivRegisterData();
        const res = await request.post('/users/create/indiv').send(userIndiv);
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("user");

        indivUser = res.body.user;
    });
    test('POST /users/create/indiv with already defined email should return a 400', async() => {
        const userIndiv = _userIndivRegisterData();
        const res = await request.post('/users/create/indiv').send(userIndiv);
            expect(res.status).toBe(400);
    });
    test('PUT /users/update/user with values should return 200: update indiv', async() => {  
        const updateData = { aboutMe: "I like fries!", firstName: "Georgie" };
        const res = await request.put('/users/update/user')
            .set("Authorization", `Bearer ${indivUser.accessToken}`)
            .send(updateData);

        expect(res.status).toBe(200);
        indivUser = await prisma.user.findFirst({ 
            where: { id: indivUser.id },
            include: { indiv: true }
        }) as User & { indiv: Individual, accessToken: string };

        // Fields added to the request should be edited
        expect(indivUser.aboutMe).toBe("I like fries!");
        expect(indivUser.indiv.firstName).toBe("Georgie");

        // Fields not added to the request should not be edited
        expect(indivUser.indiv.lastName).toBe("Washington");
    });
    // #endregion Individual

    // #region Church
    test('POST /users/create/church with a password with length < 8 should return a 400', async() => {
        const userChurch = _userChurchRegisterData();
        userChurch.user.password = "short";

        const res = await request.post('/users/create/church').send(userChurch);
            expect(res.status).toBe(422); // 422 Status Code should be returned
            expect(
                await prisma.user.findFirst({ where: { email: "church@mail.com" } })
            ).toBe(null); // The user should not have been created
    });
    test('POST users/create/church with non-existant address should return 400: no created church', async() => {
        const userChurch = _userChurchRegisterData();
        userChurch.church.address = "Fake address!";
        userChurch.church.city = "Fake city!";
        userChurch.church.state = "Fake state!";
        userChurch.church.zipCode = 11111;

        const res = await request.post('/users/create/church').send(userChurch);
        expect(res.status).toBe(400);
    });
    test('POST users/create/church with appropriate values should return a 201: created new Church', async() => {
        const userChurch = _userChurchRegisterData();
        const res = await request.post('/users/create/church').send(userChurch);
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("user");

        churchUser = res.body.user;
    });
    test('POST /users/create/church with already defined email should return a 400', async() => {
        const userChurch = _userChurchRegisterData();
        const res = await request.post('/users/create/church').send(userChurch);
            expect(res.status).toBe(400);
    });
    test('PUT /users/update/user with appropriate values should return 200: update church', async() => {
        const updateData = { aboutMe: "We are Trinity Church!", name: "Trinity Church" };
        const res = await request.put('/users/update/user')
            .set("Authorization", `Bearer ${churchUser.accessToken}`)
            .send(updateData);

        expect(res.status).toBe(200);
        churchUser = await prisma.user.findFirst({ 
            where: { id: churchUser.id },
            include: { church: true }
        }) as User & { church: Church, accessToken: string };

        // Fields added to the request should be edited
        expect(churchUser.aboutMe).toBe("We are Trinity Church!");
        expect(churchUser.church.name).toBe("Trinity Church");

        // Fields not added to the request should not be edited
        expect(churchUser.church.zipCode).toBe(20500);
    });
    test('PUT /users/update/user with non-existant address should return 400: non-updated church', async() => {
        const updateData = { address: "678 Nonexistant Street", city: "Nowhere", state: "Nostate", zipCode: 11111 };
        const res = await request.put('/users/update/user')
            .set("Authorization", `Bearer ${churchUser.accessToken}`)
            .send(updateData);

        expect(res.status).toBe(400);

        churchUser = await prisma.user.findFirst({ 
            where: { id: churchUser.id },
            include: { church: true }
        }) as User & { church: Church, accessToken: string };

        // Fields added to the request should be edited
        expect(churchUser.church.address).toBe("1600 Pennsylvania Ave., N.W.");
        expect(churchUser.church.city).toBe("Washington");
        expect(churchUser.church.zipCode).toBe(20500);
    });
    // #endregion Church

    // #region GET requests
    test('GET /users/:userId with existing userId should show a unique user', async () => {
        const res = await request.get(`/users/${indivUser.id}`);
            expect(res.status).toEqual(200);
            expect(res.type).toEqual(expect.stringContaining('json'));
            expect(res.body).toHaveProperty("indiv");
    });
    test('GET /users/:userId with nonexistant userId should return a 400', async () => {
        const res = await request.get('/users/non-existant');
            expect(res.status).toEqual(400);
    });
    // #endregion GET requests

    // #region Update Email/Password
    test("PUT /update/email with valid email should add to user's replacementEmail field, and make emailConfirmed false.", async () => {
        // First, send the update request
        let res = await request.put("/users/update/email")
            .set("Authorization", `Bearer ${indivUser.accessToken}`)
            .send({ email: "georgie@mail.com" });

        expect(res.status).toBe(200);

        // Ensure the affected User has their replacementEmail field updated
        // and that their confirmedEmail boolean is false
        let user = await prisma.user.findFirst({
            where: { id: indivUser.id }
        });
        expect(user?.confirmedEmail).toBe(false);
        expect(user?.replacementEmail).toBe("georgie@mail.com");
        expect(user?.email).toBe("washington@mail.com");

        // Finally, send the GET request to update the email
        res = await request.get(`/users/confirm-email/${user?.confirmedEmailRoute}`);

        user = await prisma.user.findFirst({
            where: { id: indivUser.id }
        });
        expect(user?.confirmedEmail).toBe(true);
        expect(user?.email).toBe("georgie@mail.com");
    });
    test("POST /create/indiv with email already taken in another's replacementEmail field should return 400", async() => {
        // First, send the update request
        await request.put("/users/update/email")
            .set("Authorization", `Bearer ${indivUser.accessToken}`)
            .send({ email: "taken-email@mail.com" });

        const userData = { 
            user: { email: "taken-email@mail.com", password: "password", aboutMe: "" }, 
            indiv: { firstName: "", lastName: "" }
        };
        const res = await request.post("/users/create/indiv").send(userData);

        expect(res.status).toBe(400);
    });
    test("POST /create/church with email already taken in another's replacementEmail field should return 400", async() => {
        // First, send the update request
        await request.put("/users/update/email")
            .set("Authorization", `Bearer ${churchUser.accessToken}`)
            .send({ email: "taken-church-email@mail.com" });

        const userData = { 
            user: { email: "taken-church-email@mail.com", password: "password", aboutMe: "" }, 
            church: { name: "", address: "", city: "", state: "", zipCode: 0 }
        };
        const res = await request.post("/users/create/church").send(userData);

        expect(res.status).toBe(400);
    });
    test("PUT /update/email with email already taken in another replacementEmail field should return 400", async() => {
        await request.put("/users/update/email")
            .set("Authorization", `Bearer ${indivUser.accessToken}`)
            .send({ email: "replacement@mail.com" });

        const res = await request.put("/users/update/email")
            .set("Authorization", `Bearer ${churchUser.accessToken}`)
            .send({ email: "replacement@mail.com" });

        expect(res.status).toBe(400);
    });
    test("PUT /update/password with valid email should change the user's", async () => {
        let res = await request.put("/users/update/password")
            .set("Authorization", `Bearer ${churchUser.accessToken}`)
            .send({ password: "hobbit1234" });

        expect(res.status).toBe(200);

        const loginData = { email: churchUser.email, password: "hobbit1234" };
        res = await request.post('/auth/login').send(loginData);
        expect(res.status).toBe(200);
    });
    // #endregion

    afterAll(async () => {
        // After testing, delete the test User
        await prisma.user.deleteMany({
            where: { 
                OR: [{
                    id: indivUser.id,
                }, { 
                    id: churchUser.id
                }]
            }
        });
    });
});

const _userChurchRegisterData = () => { return { 
    user: { email: "church@mail.com", password: "password", aboutMe: "The White House!" },
    church: { name: "The White House", address: "1600 Pennsylvania Ave., N.W.", city: "Washington", state: "D.C.", zipCode: 20500 },
}; };

const _userIndivRegisterData = () => { return {
    user: { email: "washington@mail.com", password: "password", aboutMe: "1st president of the United States" },
    indiv: { firstName: "George", lastName: "Washington" },
}; };
