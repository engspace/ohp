import gql from 'graphql-tag';

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
