import { IResolvers } from 'apollo-server-koa';
import gql from 'graphql-tag';
import { User, IdOr } from '@engspace/core';
import { GqlContext } from '@engspace/server-api';
import { Organization, isOrganization } from '@ohp/core';
import { OhpControllerSet } from '../control';

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
    buildResolvers(control: OhpControllerSet): IResolvers {
        async function selfOrg(
            ctx: GqlContext,
            organization: IdOr<Organization>
        ): Promise<Organization> {
            if (isOrganization(organization)) return organization;
            return control.organization.byId(ctx, organization.id);
        }

        return {
            User: {
                async organization(
                    { organization }: User,
                    args,
                    ctx: GqlContext
                ): Promise<Organization> {
                    return selfOrg(ctx, organization);
                },

                async organizations(
                    { id, organization }: User,
                    { includeSelf }: { includeSelf: boolean },
                    ctx: GqlContext
                ): Promise<Organization[]> {
                    const self = [];
                    if (includeSelf) {
                        self.push(await selfOrg(ctx, organization));
                    }
                    return [...self, ...(await control.organization.byUserId(ctx, id))];
                },
            },
        };
    },
};
