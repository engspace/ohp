import gql from 'graphql-tag';
import { Id, User, isUser } from '@engspace/core';
import {
    Organization,
    OrganizationInput,
    OrganizationMemberInput,
    OrganizationMember,
    isOrganization,
} from '@ohp/core';
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
            selfUser: User
        }

        input OrganizationMemberInput {
            organizationId: ID!
            userId: ID!
            roles: [String!]
        }

        type OrganizationMember {
            id: ID!
            organization: Organization!
            user: User!
            roles: [String!]
        }

        extend type Query {
            organization(id: ID!): Organization!
            organizationByName(name: String!): Organization
        }

        extend type Mutation {
            organizationCreate(input: OrganizationInput!): Organization!

            organizationMemberAdd(input: OrganizationMemberInput!): OrganizationMember!
            organizationMemberRemove(memberId: ID!): OrganizationMember!
            organizationMemberUpdate(memberId: ID!, roles: [String!]): OrganizationMember!
        }
    `,
    resolvers: {
        Organization: {
            async selfUser(
                { selfUser }: Organization,
                args: unknown,
                ctx: OhpGqlContext
            ): Promise<User> {
                if (isUser(selfUser)) return selfUser;
                return ctx.loaders.user.load(selfUser.id);
            },
        },
        OrganizationMember: {
            async organization(
                { organization }: OrganizationMember,
                args: unknown,
                ctx: OhpGqlContext
            ): Promise<Organization> {
                if (isOrganization(organization)) return organization;
                return ctx.runtime.control.organization.byId(ctx, organization.id);
            },
            async user(
                { user }: OrganizationMember,
                args: unknown,
                ctx: OhpGqlContext
            ): Promise<User> {
                if (isUser(user)) return user;
                return ctx.loaders.user.load(user.id);
            },
        },
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

            organizationMemberAdd(
                parent: unknown,
                { input }: { input: OrganizationMemberInput },
                ctx: OhpGqlContext
            ): Promise<OrganizationMember> {
                return ctx.runtime.control.organization.memberAdd(ctx, input);
            },
            organizationMemberRemove(
                parent: unknown,
                { memberId }: { memberId: Id },
                ctx: OhpGqlContext
            ): Promise<OrganizationMember> {
                return ctx.runtime.control.organization.memberRemove(ctx, memberId);
            },
            organizationMemberUpdate(
                parent: unknown,
                { memberId, roles }: { memberId: Id; roles: string[] },
                ctx: OhpGqlContext
            ): Promise<OrganizationMember> {
                return ctx.runtime.control.organization.memberUpdate(ctx, memberId, roles);
            },
        },
    },
};
