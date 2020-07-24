import { Id, IdOr, User, DateTime } from '@engspace/core';

export enum AccountType {
    Local = 'LOCAL',
    Google = 'GOOGLE',
}

export type Provider = AccountType.Google;

export interface Account {
    id: Id;
    type: AccountType;
    active: boolean;
    user: IdOr<User>;
    registered: DateTime;
    lastSignin?: DateTime;
}

export interface SigninResult {
    bearerToken: string;
    refreshToken: string;
    account: Account;
}

export interface TokenPayload {
    /** Issuer: openhardware-platform.com */
    iss: string;
    /** Subject: the id of the user in the database */
    sub: string;
    /** Expiration date (seconds since epoch) */
    exp: number;
    /** Name (pseudo) of the user */
    name: string;
    /** Url to the user picture */
    picture: string;
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
