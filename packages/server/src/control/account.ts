import { UserInputError } from 'apollo-server-koa';
import axios from 'axios';
import validator from 'validator';
import { ApiContext } from '@engspace/server-api/dist/control';
import { Account } from '@ohp/core';
import { OhpDaoSet } from '../dao';
import { LocalAccountInput } from '../graphql/account';

export interface VerifiableAccount extends Account {
    verif: string;
}

async function verifyRecaptcha(clientResponse: string): Promise<boolean> {
    try {
        const secret = process.env.GOOGLE_RECAPTCHA_SECRET;
        const response = clientResponse;
        const verif = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            undefined,
            {
                params: {
                    secret,
                    response,
                },
            }
        );
        if (!verif.data.success) {
            console.log('recaptcha failure: ' + verif.data['error-codes']);
        }
        return verif.data.success as boolean;
    } catch (err) {
        console.log('recaptcha error: ' + err.message);
        return false;
    }
}

export class AccountControl {
    constructor(private dao: OhpDaoSet) {}

    async createLocal(
        ctx: ApiContext,
        { name, email, fullName, password, recaptchaToken }: LocalAccountInput
    ): Promise<Account> {
        if (!validator.isEmail(email)) {
            throw new UserInputError(`"${email}" is not a valid email address`);
        }
        if (!password) {
            throw new UserInputError('Invalid password');
        }
        if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
            throw new UserInputError('This application is reserved to humans.');
        }
        // all clear, we create a user, an inactive account and we send an email
        return ctx.db.transaction(async (db) => {
            const user = await this.dao.user.create(db, { name, email, fullName });
            const account = await this.dao.account.createLocal(db, { userId: user.id, password });

            console.log('creating account');
            console.log(user);
            console.log(account);
            return account;
        });
    }
}
