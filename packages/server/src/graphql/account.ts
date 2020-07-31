import gql from 'graphql-tag';
import { User, isUser } from '@engspace/core';
import { EsGqlContext } from '@engspace/server-api';
import { Account, SigninResult } from '@ohp/core';
import { OhpGqlContext } from '.';

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
            refreshToken: String!
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

    resolvers: {
        Account: {
            async user({ user }: Account, args: unknown, ctx: EsGqlContext): Promise<User> {
                if (isUser(user)) {
                    return user;
                }
                return ctx.loaders.user.load(user.id);
            },
        },
        Mutation: {
            accountCreateLocal(
                parent: unknown,
                { input }: { input: LocalAccountInput },
                ctx: OhpGqlContext
            ): Promise<Account> {
                return ctx.runtime.control.account.createLocal(ctx, input);
            },

            accountLocalSignin(
                parent: unknown,
                { input }: { input: LocalSigninInput },
                ctx: OhpGqlContext
            ): Promise<SigninResult | null> {
                return ctx.runtime.control.account.localSignin(ctx, input);
            },

            accountGoogleSignin(
                parent: unknown,
                { input }: { input: GoogleSigninInput },
                ctx: OhpGqlContext
            ): Promise<SigninResult | null> {
                return ctx.runtime.control.account.googleSignin(ctx, input);
            },
        },
    },
};
