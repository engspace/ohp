import { UserInputError, ForbiddenError } from 'apollo-server-koa';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import validator from 'validator';
import { User, UserInput } from '@engspace/core';
import { signJwt } from '@engspace/server-api';
import { Account, AccountType, TokenPayload, SigninResult } from '@ohp/core';
import { OhpKoaMiddleware, OhpContext } from '..';
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

async function createUserWithOrg(
    ctx: OhpContext,
    { name, email, fullName }: Omit<UserInput, 'organizationId'>
): Promise<User> {
    const {
        db,
        runtime: { dao },
    } = ctx;
    const org = await dao.organization.create(db, {
        name,
        description: `organization for user ${name}`,
    });
    const user = await dao.user.create(db, {
        organizationId: org.id,
        name,
        email,
        fullName,
    });
    await dao.organizationMember.create(db, {
        organizationId: org.id,
        userId: user.id,
        roles: ['self'],
    });
    user.organization = org;
    return user;
}

export class AccountControl {
    async createLocal(
        ctx: OhpContext,
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
        // all clear, we create an organization and a user, an inactive account and we send an email
        const { dao } = ctx.runtime;
        return ctx.db.transaction(async (db) => {
            const user = await createUserWithOrg(ctx, { name, email, fullName });
            const account = await dao.account.createLocal(db, {
                userId: user.id,
                password,
            });

            console.log('creating account');
            console.log(user);
            console.log(account);
            account.user = user;
            // TODO send email
            return account;
        });
    }

    async localSignin(
        ctx: OhpContext,
        { email, password }: LocalSigninInput
    ): Promise<SigninResult | null> {
        const { db } = ctx;
        const { dao } = ctx.runtime;
        const user = await dao.user.byEmail(db, email);
        if (!user) {
            throw new ForbiddenError('no such email in the database');
        }
        const account = await dao.account.byUserIdAndPassword(db, {
            userId: user.id,
            password,
        });
        if (!account) {
            throw new ForbiddenError('wrong password!');
        }
        const { refreshToken, lastSignin } = await dao.account.signIn(db, account.id);
        account.user = user;
        account.lastSignin = lastSignin;
        return {
            bearerToken: await genBearerToken(user, ''),
            refreshToken,
            account,
        };
    }

    async googleSignin(
        ctx: OhpContext,
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

        const { dao } = ctx.runtime;
        const { db } = ctx;
        const { sub } = payload;
        let account = await dao.account.byProviderId(db, sub);
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
                user = await createUserWithOrg(ctx, {
                    name: registerPseudo,
                    email,
                    fullName: name,
                });
                account = await dao.account.createProvider(db, {
                    provider: AccountType.Google,
                    userId: user.id,
                    providerId: sub,
                });
            });
        } else {
            user = await dao.user.byId(db, account.user.id);
        }

        const { refreshToken, lastSignin } = await dao.account.signIn(db, account.id);
        account.user = user;
        account.lastSignin = lastSignin;

        return {
            bearerToken: await genBearerToken(user, payload.picture),
            refreshToken,
            account,
        };
    }

    refreshSigninEndpoint(): OhpKoaMiddleware {
        return async (ctx) => {
            const { refreshToken } = ctx.request.body;
            if (!refreshToken) {
                ctx.throw(401);
            }
            const { dao } = ctx.runtime;
            const { newBearerToken, newRefreshToken } = await ctx.state.db.transaction(
                async (db) => {
                    const signin = await dao.account.refreshSignIn(db, refreshToken);
                    if (!signin) return {};
                    const user = await dao.user.byId(db, signin.account.user.id);
                    const newBearerToken = await genBearerToken(user, '');
                    return {
                        newBearerToken,
                        newRefreshToken: signin.refreshToken,
                    };
                }
            );
            if (!newBearerToken || !newRefreshToken) ctx.throw(401);
            ctx.body = {
                newBearerToken,
                newRefreshToken,
            };
        };
    }
}
