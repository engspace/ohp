import { IResolvers } from 'apollo-server-koa';
import gql from 'graphql-tag';
import { Id } from '@engspace/core';
import { GqlContext } from '@engspace/server-api';
import { Organization, OrganizationInput } from '@ohp/core';
import { OhpControllerSet } from '../control';

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
    buildResolvers(control: OhpControllerSet): IResolvers {
        return {
            Query: {
                organization(parent, { id }: { id: Id }, ctx: GqlContext): Promise<Organization> {
                    return control.organization.byId(ctx, id);
                },
                organizationByName(
                    parent,
                    { name }: { name: string },
                    ctx: GqlContext
                ): Promise<Organization> {
                    return control.organization.byName(ctx, name);
                },
            },
            Mutation: {
                organizationCreate(
                    parent,
                    { input }: { input: OrganizationInput },
                    ctx: GqlContext
                ): Promise<Organization> {
                    return control.organization.create(ctx, input);
                },
            },
        };
    },
};
