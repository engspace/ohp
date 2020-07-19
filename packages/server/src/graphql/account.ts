import { IResolvers } from 'apollo-server-koa';
import gql from 'graphql-tag';
import { GqlContext } from '@engspace/server-api/dist/graphql/context';
import { Account } from '@ohp/core';
import { OhpControllerSet } from '../control';

export interface LocalAccountInput {
    email: string;
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
            email: String!
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
            Mutation: {
                accountCreateLocal(
                    parent,
                    { input }: { input: LocalAccountInput },
                    ctx: GqlContext
                ): Promise<Account> {
                    return control.account.create(ctx, input);
                },
            },
        };
    },
};
