import { UserInputError } from 'apollo-server-koa';
import validator from 'validator';
import { ApiContext } from '@engspace/server-api/dist/control';
import { Account } from '@ohp/core';
import { OhpDaoSet } from '../dao';
import { LocalAccountInput } from '../graphql/account';
import { unimplemented } from '../util';

export interface VerifiableAccount extends Account {
    verif: string;
}

export class AccountControl {
    constructor(private dao: OhpDaoSet) {}

    async create(
        ctx: ApiContext,
        { email, password, recaptchaToken }: LocalAccountInput
    ): Promise<Account> {
        if (!validator.isEmail(email)) {
            throw new UserInputError(`"${email}" is not a valid email address`);
        }
        if (!password) {
            throw new UserInputError('Invalid password');
        }
        if (!recaptchaToken) {
            throw new UserInputError('This application is reserved to humans.');
        }
        unimplemented();
    }
}
