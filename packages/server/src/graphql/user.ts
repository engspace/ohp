import gql from 'graphql-tag';
import { User } from '@engspace/core';
import { OrganizationMember } from '@ohp/core';
import { OhpGqlContext } from '.';

export default {
    typeDefs: gql`
        extend input UserInput {
            organizationId: ID!
        }
        extend type User {
            """
            Organization that has the same name as the user (aka self organization)
            """
            selfOrganization: OrganizationMember!
            """
            All organizations this user is associated with.
            includeSelf indicates whether to include the organization with
            the same name as the user.
            If self is included, it is in first position.
            """
            organizations(includeSelf: Boolean = true): [OrganizationMember!]
        }
    `,

    resolvers: {
        User: {
            async selfOrganization(
                { id }: User,
                args: unknown,
                ctx: OhpGqlContext
            ): Promise<OrganizationMember> {
                const {
                    runtime: { control },
                } = ctx;
                return control.organization.bySelfUserId(ctx, id);
            },

            async organizations(
                { id }: User,
                args: { includeSelf: boolean },
                ctx: OhpGqlContext
            ): Promise<OrganizationMember[]> {
                const {
                    runtime: { control },
                } = ctx;

                return control.organization.membersByUserId(ctx, id, args);
            },
        },
    },
};
