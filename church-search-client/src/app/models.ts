
enum UserType {
    Individual = "Individual",
    Church = "Church",
}

type Individual = {
    firstName: string,
    lastName: string,
};

type Church = {
    name: string,
    address: string,
    city: string,
    state: string,
    zipCode: number
};

type User = {
    id: string,
    email: string,
    aboutMe: string, 
    userType: UserType,

    church: Church | undefined;
    indiv: Individual | undefined;
};

type UserAndAccessToken = User & {
    indiv: Individual | null,
    church: Church | null,
    accessToken: string,
}

enum MessageType {
    Info,
    Caution,
    Error,
}

type BannerMessage = {
    message: string,
    messageType: MessageType,
};

type LoginData = {
    email: string,
    password: string,
}

type RegisterData = {
    user: {
        email: string,
        password: string,
        confirmPassword: string,
        aboutMe: string,
    },
    indiv?: {
        firstName: string,
        lastName: string,
    },
    church?: {
        name: string,
        address: string,
        city: string,
        state: string,
        zipCode: number
    }
}

export {
    UserType,
    User,
    Individual,
    Church,
    UserAndAccessToken,
    MessageType,
    BannerMessage,
    LoginData,
    RegisterData
};