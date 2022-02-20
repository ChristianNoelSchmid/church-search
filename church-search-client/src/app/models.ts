enum UserType {
    Individual,
    Church,
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
    email: string,
    aboutMe: string, 
    userType: UserType,

    church: Church | undefined;
    indiv: Individual | undefined;
};

enum MessageType {
    Info,
    Caution,
    Error,
}

type BannerMessage = {
    message: string,
    messageType: MessageType,
};

export {
    UserType,
    User,
    Individual,
    Church,
    MessageType,
    BannerMessage,
};