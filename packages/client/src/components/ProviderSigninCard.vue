<template>
    <v-card :loading="loading">
        <v-toolbar dark color="primary" flat>
            <v-toolbar-title>
                {{ registerMode ? 'Register' : 'Sign-in' }} with provider
            </v-toolbar-title>
        </v-toolbar>
        <v-card-text class="text-center">
            <v-form ref="form" v-model="formValid">
                <v-text-field
                    v-if="registerMode"
                    v-model="pseudo"
                    label="pick-up a pseudo"
                    :rules="[required]"
                    class="required"
                    prefix="@"
                ></v-text-field>
                <v-btn :disabled="!formValid" @click="googleSignIn">
                    <v-icon left>mdi-google</v-icon>
                    Google
                </v-btn>
            </v-form>
            <v-alert v-if="error" type="error" class="mt-3">{{
                error
            }}</v-alert>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { useMutation } from '@vue/apollo-composable';
import { computed, defineComponent, ref, Ref } from '@vue/composition-api';
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

function useOhpGoogleSignIn(pseudo: Ref<string | null>) {
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
                registerPseudo: pseudo.value,
                idToken: usr.getAuthResponse().id_token,
            },
        });
    });

    return { signIn, loading, onDone, error };
}

export default defineComponent({
    props: {
        registerMode: {
            type: Boolean,
            default: false,
        },
    },
    setup(props: { registerMode: boolean }) {
        const { signIn } = useAuth();

        const form = ref(null);
        const formValid = ref(!props.registerMode);
        const pseudo = ref(props.registerMode ? '' : null);
        const required = (val) => !!val || 'Required';

        const {
            signIn: googleSignIn,
            onDone: googleOnDone,
            loading,
            error,
        } = useOhpGoogleSignIn(pseudo);

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
            form,
            formValid,
            pseudo,
            required,
            googleSignIn,
            loading,
            error,
        };
    },
});
</script>
