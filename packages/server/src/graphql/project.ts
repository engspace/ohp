import { IResolvers } from 'apollo-server-koa';
import gql from 'graphql-tag';
import { OhpControllerSet } from '../control';

export default {
    typeDefs: gql`
        extend type Project {
            organization: Organization!
        }

        extend input ProjectInput {
            organizationId: ID!
        }
    `,
    resolvers: {},
};
