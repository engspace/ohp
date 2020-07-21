import { DefaultApolloClient } from '@vue/apollo-composable';
import { provide } from '@vue/composition-api';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { url as apiUrl } from './api';

// HTTP connection to the API
const httpLink = createHttpLink({
    uri: apiUrl('/api/graphql'),
    useGETForQueries: true,
});
// Cache implementation
const cache = new InMemoryCache({
    addTypename: true,
});

// Create the apollo client
export const apolloClient = new ApolloClient({
    link: httpLink,
    cache,
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'cache-and-network',
        },
    },
});

export function provideApollo() {
    provide(DefaultApolloClient, apolloClient);
}
