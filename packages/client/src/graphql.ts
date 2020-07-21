import gql from 'graphql-tag';
import { USER_FIELDS } from '@engspace/client-comps';

export const ACCOUNT_FIELDS = gql`
    fragment AccountFields on Account {
        id
        type
        user {
            ...UserFields
        }
    }
    ${USER_FIELDS}
`;

export const SIGNIN_RESULT_FIELDS = gql`
    fragment SigninResultFields on SigninResult {
        bearerToken
        account {
            ...AccountFields
        }
    }
    ${ACCOUNT_FIELDS}
`;
