import { Question, QuizTemplate, Role } from '@prisma/client';
import supertest from 'supertest';
import { app } from '../app';
import { prisma } from '../client';

let request = supertest(app);
let quizTemplates: QuizTemplate[] = []
let questions: Question[] = [];
let authToken = "";

describe('Admin Endpoints', () => {
    beforeAll(async () => {
        // Create an individual User, then update prisma to
        // convert it to Admin
        await request.post('/users/create/indiv').send({ 
            user:  { email: "chris@mail.com", password: "password", aboutMe: "Me!" },
            indiv: { firstName: "Chris", lastName: "Schmid" },
        })
        await prisma.user.update({
            where: { email: "chris@mail.com" },
            data: { role: Role.Admin },
        });
        // Delete the associated Individual row
        await prisma.individual.deleteMany({
            where: { firstName: "Chris" },
        });

        // Login as the Admin user
        const res = await request.post('/auth/login')
            .send({ email: "chris@mail.com", password: "password" });

        authToken = res.body.accessToken;
    });
    test('POST /admin/template/create creates a new QuizTemplate', async() => {
        let res = await request.post('/admin/template/create')
            .set("Authorization", "bearer " + authToken);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('quizTemplate');
        quizTemplates.push(res.body.quizTemplate);
    });
    test('POST /admin/question/create creates a new Question', async() => {
        let res = await request.post('/admin/question/create')
            .set("Authorization", "bearer " + authToken).send({ 
                text: "What kind of bear is best?",
                choices: [ "There are two schools of thought", "FALSE. Black bear" ],
                templateId: quizTemplates[0].id,
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('question');

        questions.push(res.body.question);
        
        res = await request.post('/admin/question/create')
            .set("Authorization", "bearer " + authToken).send({ 
                text: "Break me off a piece of that...",
                choices: [ "Applesauce", "Fancy feast", "Kitkat bar" ],
                templateId: quizTemplates[0].id,
            });

        questions.push(res.body.question);

        res = await request.post('/admin/question/create')
            .set("Authorization", "bearer " + authToken).send({ 
                text: "Best Gravity Falls character.",
                choices: [ "Mabel", "Dipper", "Grunkle Stan", "Soos", "Wendy" ],
                templateId: quizTemplates[0].id,
            });

        questions.push(res.body.question);
        const template = await prisma.quizTemplate.findFirst({
            where: { id: quizTemplates[0].id, },
            include: { qToTemp: true, },
        });
        console.log(template);

        expect(template?.qToTemp.length).toBe(3);
    });
    test('POST /admin/template/duplicate duplicates a QuizTemplate', async() => {
        let res = await request.post('/admin/template/duplicate')
            .set("Authorization", "bearer " + authToken)
            .send({ templateId: quizTemplates[0].id });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("quizTemplate");
        const newTemplateId = res.body.quizTemplate.id;
        expect(newTemplateId).not.toBe(quizTemplates[0].id);

        // Expect the new QuizTemplate to have all references to the 
        // Questions
        questions.forEach(async q => {
            const question = await prisma.question.findFirst({
                where: { id: q.id, },
                include: { qToTemp: true },
            });
            expect(question!.qToTemp.some(qtt => qtt.templateId == newTemplateId)).toBeTruthy();
        });
        quizTemplates.push(res.body.quizTemplate);
    });
    test('POST /admin/question/duplicate duplicates a Question', async () => {
        let res = await request.post('/admin/question/duplicate')
            .set("Authorization", "bearer " + authToken)
            .send({ questionId: questions[0].id });

        questions.push(res.body.question);
        expect(questions[0].id).not.toBe(questions[questions.length - 1].id);
        expect(questions[0].text).toBe(questions[questions.length - 1].text);
        expect(questions[0].choices).toBe(questions[questions.length - 1].choices);
    });
    test('PUT /admin/question/associate adds a Question reference to a QuizTemplate', async () => {
        await request.put('/admin/question/associate')
            .set("Authorization", "bearer " + authToken)
            .send({ questionId: questions[0].id, templateId: quizTemplates[0].id, qIndex: 1 });
        
        expect((await prisma.questionToTemplate.findFirst({ 
            where: { questionId: questions[0].id, templateId: quizTemplates[0].id }
        }))?.qIndex).toBe(1);
        expect((await prisma.questionToTemplate.findFirst({ 
            where: { questionId: questions[1].id, templateId: quizTemplates[0].id }
        }))?.qIndex).toBe(0);
        expect((await prisma.questionToTemplate.findFirst({ 
            where: { questionId: questions[2].id, templateId: quizTemplates[0].id }
        }))?.qIndex).toBe(2);  

        await request.put('/admin/question/associate')
            .set("Authorization", "bearer " + authToken)
            .send({ questionId: questions[3].id, templateId: quizTemplates[1].id, qIndex: 2 });

        expect((await prisma.questionToTemplate.findFirst({ 
            where: { questionId: questions[0].id, templateId: quizTemplates[1].id }
        }))?.qIndex).toBe(0);
        expect((await prisma.questionToTemplate.findFirst({ 
            where: { questionId: questions[1].id, templateId: quizTemplates[1].id }
        }))?.qIndex).toBe(1);
        expect((await prisma.questionToTemplate.findFirst({ 
            where: { questionId: questions[3].id, templateId: quizTemplates[1].id }
        }))?.qIndex).toBe(2);  
        expect((await prisma.questionToTemplate.findFirst({ 
            where: { questionId: questions[2].id, templateId: quizTemplates[1].id }
        }))?.qIndex).toBe(3);  
    });

    afterAll(async () => {
        await prisma.user.delete({ where: { email: "chris@mail.com" } });
        await prisma.quizTemplate.deleteMany({ where: { id: { not: -1 } } });
        await prisma.question.deleteMany({ where: { id: { not: -1 } } });
    })
});
