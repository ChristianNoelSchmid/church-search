import { Answer, Church, Question, QuestionToTemplate, QuizTemplate, User } from "@prisma/client"

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
    accessToken: string
}   

export {
    QuizTemplateWithQuestions,
    ChurchWithAnswers,
    ChurchUserScores,
    UserAndAccessToken,
}