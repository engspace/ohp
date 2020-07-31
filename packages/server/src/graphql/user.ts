import gql from 'graphql-tag';
import { User, IdOr } from '@engspace/core';
import { Organization, isOrganization } from '@ohp/core';
import { OhpGqlContext } from '.';

async function selfOrg(
    ctx: OhpGqlContext,
    organization: IdOr<Organization>
): Promise<Organization> {
    if (isOrganization(organization)) return organization;
    return ctx.runtime.control.organization.byId(ctx, organization.id);
}

export default {
    typeDefs: gql`
        extend input UserInput {
            organizationId: ID!
        }
        extend type User {
            """
            Organization that has the same name as the user (aka self organization)
            """
            organization: Organization!
            """
            All organizations this user is associated with.
            includeSelf indicates whether to include the organization with
            the same name as the user.
            If self is included, it is in first position.
            """
            organizations(includeSelf: Boolean = true): [Organization!]
        }
    `,

    resolvers: {
        User: {
            async organization(
                { organization }: User,
                args: unknown,
                ctx: OhpGqlContext
            ): Promise<Organization> {
                return selfOrg(ctx, organization);
            },

            async organizations(
                { id, organization }: User,
                { includeSelf }: { includeSelf: boolean },
                ctx: OhpGqlContext
            ): Promise<Organization[]> {
                const self = [];
                if (includeSelf) {
                    self.push(await selfOrg(ctx, organization));
                }
                return [...self, ...(await ctx.runtime.control.organization.byUserId(ctx, id))];
            },
        },
    },
};
