import { IResolvers } from 'apollo-server-koa';
import gql from 'graphql-tag';
import { User } from '@engspace/core';
import { GqlContext } from '@engspace/server-api';
import { Account } from '@ohp/core';
import { OhpControllerSet } from '../control';

export interface LocalAccountInput {
    name: string;
    email: string;
    fullName: string;
    password: string;
    recaptchaToken: string;
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
        }

        input LocalAccountInput {
            name: String!
            email: String!
            fullName: String
            password: String!
            recaptchaToken: String!
        }

        extend type User {
            account: Account
        }

        extend type Mutation {
            accountCreateLocal(input: LocalAccountInput!): Account!
        }
    `,

    buildResolvers(control: OhpControllerSet): IResolvers {
        return {
            Account: {
                user({ user }: Account, args, ctx: GqlContext): Promise<User> {
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
            },
        };
    },
};
