import { Id, IdOr, User } from '@engspace/core';

export enum AccountType {
    Local = 'LOCAL',
    Google = 'GOOGLE',
}

export interface Account {
    id: Id;
    type: AccountType;
    active: boolean;
    user: IdOr<User>;
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
