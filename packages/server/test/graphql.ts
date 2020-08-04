import gql from 'graphql-tag';

export const USER_FIELDS = gql`
    fragment UserFields on User {
        id
        name
        email
        fullName
    }
`;
export const ORG_FIELDS = gql`
    fragment OrgFields on Organization {
        id
        name
        description
        selfUser {
            ...UserFields
        }
    }
    ${USER_FIELDS}
`;
