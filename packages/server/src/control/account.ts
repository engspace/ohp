import { UserInputError, ForbiddenError } from 'apollo-server-koa';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import validator from 'validator';
import { User } from '@engspace/core';
import { Token } from '@engspace/core/dist/naming/base';
import { ApiContext } from '@engspace/server-api/dist/control';
import { signJwt } from '@engspace/server-api/dist/crypto';
import { Account, AccountType, TokenPayload, SigninResult } from '@ohp/core';
import { OhpDaoSet } from '../dao';
import env from '../env';
import { LocalAccountInput, GoogleSigninInput, LocalSigninInput } from '../graphql/account';

const oauthClient = new OAuth2Client({
    clientId: env.googleSigninClientId,
});

async function verifyRecaptcha(clientResponse: string): Promise<boolean> {
    try {
        const verif = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            undefined,
            {
                params: {
                    secret: env.googleRecaptchaSecret,
                    response: clientResponse,
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

function bearerToken(user: User, picture: string): Promise<string> {
    const payload: TokenPayload = {
        iss: 'open-hardware-platform.com',
        sub: user.id,
        name: user.name,
        picture,
    };
    return signJwt(payload, env.jwtSecret, {});
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
            account.user = user;
            return account;
        });
    }

    async localSignin(
        ctx: ApiContext,
        { email, password }: LocalSigninInput
    ): Promise<SigninResult | null> {
        const { db } = ctx;
        const user = await this.dao.user.byEmail(db, email);
        if (!user) {
            throw new ForbiddenError('no such email in the database');
        }
        const account = await this.dao.account.byUserIdAndPassword(db, {
            userId: user.id,
            password,
        });
        if (!account) {
            throw new ForbiddenError('wrong password!');
        }
        account.user = user;
        return {
            bearerToken: await bearerToken(user, ''),
            account,
        };
    }

    async googleSignin(
        ctx: ApiContext,
        { idToken }: GoogleSigninInput
    ): Promise<SigninResult | null> {
        let payload;
        try {
            const ticket = await oauthClient.verifyIdToken({
                idToken,
                audience: env.googleSigninClientId,
            });
            payload = ticket.getPayload();
        } catch (err) {
            console.log(err);
        }

        const { db } = ctx;
        const { sub } = payload;
        let account = await this.dao.account.byProviderId(db, sub);
        let user: User;
        if (!account) {
            // user not registered
            const { email, name } = payload;
            await db.transaction(async (db) => {
                user = await this.dao.user.create(db, { name: sub, email, fullName: name });
                account = await this.dao.account.createProvider(db, {
                    provider: AccountType.Google,
                    userId: user.id,
                    providerId: sub,
                });
            });
        } else {
            user = await this.dao.user.byId(db, account.user.id);
        }

        account.user = user;
        return {
            bearerToken: await bearerToken(user, payload.picture),
            account,
        };
    }
}
