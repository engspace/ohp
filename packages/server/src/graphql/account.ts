import { IResolvers } from 'apollo-server-koa';
import gql from 'graphql-tag';
import { User } from '@engspace/core';
import { GqlContext, isUser } from '@engspace/server-api';
import { Account, SigninResult } from '@ohp/core';
import { OhpControllerSet } from '../control';

export interface LocalAccountInput {
    name: string;
    email: string;
    fullName: string;
    password: string;
    recaptchaToken: string;
}

export interface LocalSigninInput {
    email: string;
    password: string;
}

export interface GoogleSigninInput {
    registerPseudo?: string;
    idToken: string;
}

export default {
    typeDefs: gql`
        enum AccountType {
            LOCAL
            GOOGLE
        }

        type Account {
            id: ID!
            type: AccountType!
            active: Boolean!
            user: User!
            registered: DateTime!
            lastSignin: DateTime
        }

        type SigninResult {
            bearerToken: String!
            account: Account!
        }

        input LocalAccountInput {
            name: String!
            email: String!
            fullName: String
            password: String!
            recaptchaToken: String!
        }

        input LocalSigninInput {
            email: String!
            password: String!
        }

        input GoogleSigninInput {
            registerPseudo: String
            idToken: String!
        }

        extend type User {
            account: Account
        }

        extend type Mutation {
            accountCreateLocal(input: LocalAccountInput!): Account!
            accountLocalSignin(input: LocalSigninInput!): SigninResult
            accountGoogleSignin(input: GoogleSigninInput!): SigninResult
        }
    `,

    buildResolvers(control: OhpControllerSet): IResolvers {
        return {
            Account: {
                async user({ user }: Account, args, ctx: GqlContext): Promise<User> {
                    if (isUser(user)) {
                        return user;
                    }
                    return ctx.loaders.user.load(user.id);
                },
            },
            Mutation: {
                accountCreateLocal(
                    parent,
                    { input }: { input: LocalAccountInput },
                    ctx: GqlContext
                ): Promise<Account> {
                    return control.account.createLocal(ctx, input);
                },

                accountLocalSignin(
                    parent,
                    { input }: { input: LocalSigninInput },
                    ctx: GqlContext
                ): Promise<SigninResult | null> {
                    return control.account.localSignin(ctx, input);
                },

                accountGoogleSignin(
                    parent,
                    { input }: { input: GoogleSigninInput },
                    ctx: GqlContext
                ): Promise<SigninResult | null> {
                    return control.account.googleSignin(ctx, input);
                },
            },
        };
    },
};
