<template>
    <v-card :loading="loading">
        <v-toolbar dark color="primary" flat>
            <v-toolbar-title>
                Sign-in or register with provider
            </v-toolbar-title>
        </v-toolbar>
        <v-card-text class="text-center">
            <v-btn @click="googleSignIn">
                <v-icon left>mdi-google</v-icon>
                Google
            </v-btn>
            <v-alert v-if="error" type="error">{{ error }}</v-alert>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { useMutation } from '@vue/apollo-composable';
import { computed, defineComponent } from '@vue/composition-api';
import gql from 'graphql-tag';
import { ACCOUNT_FIELDS } from '@/graphql';
import { useAuth } from '@/services/auth';
import { GoogleUser, useGoogleSignIn } from '@/services/google-signin';

const ACCOUNT_GOOGLE_SIGNIN = gql`
    mutation GoogleAccountSignin($input: GoogleSigninInput!) {
        accountGoogleSignin(input: $input) {
            bearerToken
            account {
                ...AccountFields
            }
        }
    }
    ${ACCOUNT_FIELDS}
`;

function useOhpGoogleSignIn() {
    const { signIn, onSuccess } = useGoogleSignIn();
    const { mutate, error: mutateError, onDone, loading } = useMutation(
        ACCOUNT_GOOGLE_SIGNIN
    );

    const error = computed(() => {
        if (mutateError.value) {
            return mutateError.value.message;
        }
    });

    onSuccess((usr: GoogleUser) => {
        mutate({
            input: {
                idToken: usr.getAuthResponse().id_token,
            },
        });
    });

    return { signIn, loading, onDone, error };
}

export default defineComponent({
    setup() {
        const { signIn } = useAuth();

        const {
            signIn: googleSignIn,
            onDone: googleOnDone,
            loading,
            error,
        } = useOhpGoogleSignIn();

        googleOnDone(
            ({
                data: {
                    accountGoogleSignin: { bearerToken },
                },
            }) => {
                console.log('signing in with ' + bearerToken);
                signIn(bearerToken);
                // redirect
            }
        );

        return {
            googleSignIn,
            loading,
            error,
        };
    },
});
</script>
