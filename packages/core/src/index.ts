import { Id, IdOr, User } from '@engspace/core';

export enum AccountType {
    Local = 'LOCAL',
    Google = 'GOOGLE',
}

export interface Account {
    id: Id;
    type: AccountType;
    user?: IdOr<User>;
    email: string;
}

export interface Organization {
    id: Id;
    name: string;
    description: string;
}

declare module '@engspace/core' {
    export interface Project {
        organization: IdOr<Organization>;
    }
    export interface ProjectInput {
        organizationId: Id;
    }
}
