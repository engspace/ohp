import gql from 'graphql-tag';
import { Id } from '@engspace/core';
import { Organization, OrganizationInput } from '@ohp/core';
import { OhpGqlContext } from '.';

export default {
    typeDefs: gql`
        input OrganizationInput {
            name: String!
            description: String!
        }
        type Organization {
            id: ID!
            name: String!
            description: String!
        }
        extend type Query {
            organization(id: ID!): Organization!
            organizationByName(name: String!): Organization
        }
        extend type Mutation {
            organizationCreate(input: OrganizationInput!): Organization!
        }
    `,
    resolvers: {
        Query: {
            organization(
                parent: unknown,
                { id }: { id: Id },
                ctx: OhpGqlContext
            ): Promise<Organization> {
                return ctx.runtime.control.organization.byId(ctx, id);
            },
            organizationByName(
                parent: unknown,
                { name }: { name: string },
                ctx: OhpGqlContext
            ): Promise<Organization> {
                return ctx.runtime.control.organization.byName(ctx, name);
            },
        },
        Mutation: {
            organizationCreate(
                parent: unknown,
                { input }: { input: OrganizationInput },
                ctx: OhpGqlContext
            ): Promise<Organization> {
                return ctx.runtime.control.organization.create(ctx, input);
            },
        },
    },
};
