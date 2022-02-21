import { Answer, Church, Individual, Question, QuestionToTemplate, QuizTemplate, User } from "@prisma/client"

type QuizTemplateWithQuestions = QuizTemplate & { 
    qToTemp: QuestionToTemplate[]
};

type ChurchWithAnswers = (
    User & { 
        answers: (Answer & { 
            question: Question 
        })[], 
        church: Church | null 
    }
); 

type ChurchUserScores = { 
    church: Church & { 
        answers: Answer[] 
    }, 
    match: number 
};

type UserAndAccessToken = User & {
    church: Church | null,
    indiv: Individual | null,
    accessToken: string
}   

const sleep = (ms: number) => { return new Promise((resolve) => setTimeout(resolve, ms))}

export {
    QuizTemplateWithQuestions,
    ChurchWithAnswers,
    ChurchUserScores,
    UserAndAccessToken,
    sleep
}