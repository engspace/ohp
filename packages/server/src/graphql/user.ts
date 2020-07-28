import { IResolvers } from 'apollo-server-koa';
import gql from 'graphql-tag';

export default {
    typeDefs: gql`
        extend input UserInput {
            organizationId: ID!
        }
        extend type User {
            organization: Organization!
        }
    `,
    buildResolvers(): IResolvers {
        return {};
    },
};
