import { UserInputError, ForbiddenError } from 'apollo-server-koa';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { Middleware as KoaMiddleware } from 'koa';
import validator from 'validator';
import { User, AuthToken, AppRolePolicies } from '@engspace/core';
import {
    ApiContext,
    signJwt,
    extractBearerToken,
    verifyJwt,
    EsKoaState,
} from '@engspace/server-api';
import { DbPool } from '@engspace/server-db';
import { Account, AccountType, TokenPayload, SigninResult } from '@ohp/core';
import { OhpDaoSet } from '../dao';
import env from '../env';
import { LocalAccountInput, GoogleSigninInput, LocalSigninInput } from '../graphql/account';

type OhpKoaState = EsKoaState;

type Middleware = KoaMiddleware<OhpKoaState>;

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

function genBearerToken(user: User, picture: string): Promise<string> {
    const payload: Omit<TokenPayload, 'exp' | 'iss' | 'sub'> = {
        name: user.name,
        picture,
    };
    return signJwt(payload, env.jwtSecret, {
        expiresIn: 10 * 60,
        issuer: 'openhardware-platform.com',
        subject: user.id,
    });
}

export class AccountControl {
    constructor(
        private dao: OhpDaoSet,
        private pool: DbPool,
        private rolePolices: AppRolePolicies
    ) {}

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
        const { refreshToken, lastSignin } = await this.dao.account.signIn(db, account.id);
        account.user = user;
        account.lastSignin = lastSignin;
        return {
            bearerToken: await genBearerToken(user, ''),
            refreshToken,
            account,
        };
    }

    async googleSignin(
        ctx: ApiContext,
        { registerPseudo, idToken }: GoogleSigninInput
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
            if (!registerPseudo) {
                throw new UserInputError(
                    'Account is not in database. Registration requires a Pseudonym!'
                );
            }
            const { email, name } = payload;
            await db.transaction(async (db) => {
                user = await this.dao.user.create(db, {
                    name: registerPseudo,
                    email,
                    fullName: name,
                });
                account = await this.dao.account.createProvider(db, {
                    provider: AccountType.Google,
                    userId: user.id,
                    providerId: sub,
                });
            });
        } else {
            user = await this.dao.user.byId(db, account.user.id);
        }

        const { refreshToken, lastSignin } = await this.dao.account.signIn(db, account.id);
        account.user = user;
        account.lastSignin = lastSignin;

        return {
            bearerToken: await genBearerToken(user, payload.picture),
            refreshToken,
            account,
        };
    }

    refreshSigninEndpoint(): Middleware {
        return async (ctx) => {
            const { refreshToken } = ctx.request.body;
            if (!refreshToken) {
                ctx.throw(401);
            }
            const { newBearerToken, newRefreshToken } = await this.pool.transaction(async (db) => {
                const signin = await this.dao.account.refreshSignIn(db, refreshToken);
                if (!signin) return {};
                const user = await this.dao.user.byId(db, signin.account.user.id);
                const newBearerToken = await genBearerToken(user, '');
                return {
                    newBearerToken,
                    newRefreshToken: signin.refreshToken,
                };
            });
            if (!newBearerToken || !newRefreshToken) ctx.throw(401);
            ctx.body = {
                newBearerToken,
                newRefreshToken,
            };
        };
    }

    checkBearerTokenMiddleware(): Middleware {
        const userPerms = this.rolePolices.user.permissions([]);
        return async (ctx, next) => {
            //
            const token = extractBearerToken(ctx);
            if (token) {
                try {
                    const payload = await verifyJwt<TokenPayload>(token, env.jwtSecret);
                    ctx.state.authToken = {
                        userId: payload.sub,
                        userPerms,
                    };
                } catch (err) {
                    console.error(err);
                    ctx.throw(403);
                }
            } else {
                ctx.state.authToken = {
                    userId: '',
                    userPerms,
                };
            }
            return next();
        };
    }
}
