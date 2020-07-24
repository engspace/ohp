<template>
    <v-container>
        <v-row align="center" justify="center" class="my-12">
            <v-col cols="12" sm="8" md="6" lg="4">
                <provider-signin-card></provider-signin-card>
            </v-col>
        </v-row>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="8" md="6" lg="4">
                <v-card>
                    <v-toolbar dark color="primary" flat>
                        <v-toolbar-title>
                            Sign-in with e-mail and password
                        </v-toolbar-title>
                    </v-toolbar>
                    <v-card-text>
                        <v-form ref="form" v-model="canSignIn">
                            <v-text-field
                                v-model="email"
                                prepend-icon="mdi-at"
                                label="E-mail"
                                :rules="[required, isEmail]"
                                dense
                            ></v-text-field>
                            <v-text-field
                                v-model="password"
                                label="Password"
                                :rules="[required]"
                                prepend-icon="mdi-lock"
                                :append-icon="
                                    showPswd ? 'mdi-eye' : 'mdi-eye-off'
                                "
                                :type="showPswd ? 'text' : 'password'"
                                dense
                                @click:append="showPswd = !showPswd"
                            ></v-text-field>
                            <v-alert v-if="error" type="error">{{
                                error ? error.message : ''
                            }}</v-alert>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :disabled="!canSignIn"
                            @click="signIn"
                            >Sign-in</v-btn
                        >
                        <v-spacer></v-spacer>
                        <v-subheader>Not registered yet?</v-subheader>
                        <v-btn to="/register" color="secondary">Register</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { useMutation } from '@vue/apollo-composable';
import { defineComponent, ref } from '@vue/composition-api';
import gql from 'graphql-tag';
import validator from 'validator';
import ProviderSigninCard from '@/components/ProviderSigninCard.vue';
import { SIGNIN_RESULT_FIELDS } from '@/graphql';
import { useAuth } from '@/services/auth';

export default defineComponent({
    components: {
        ProviderSigninCard,
    },
    setup() {
        const form = ref(null);
        const email = ref('');
        const password = ref('');
        const showPswd = ref(false);

        const canSignIn = ref(false);
        const required = (val: string) => !!val || 'Required';
        const isEmail = (val: string) =>
            (!!val && validator.isEmail(val)) || 'Enter a valid e-mail address';

        const { mutate: signIn, error, onDone } = useMutation(
            gql`
                mutation LocalAccountSignin($input: LocalSigninInput!) {
                    accountLocalSignin(input: $input) {
                        ...SigninResultFields
                    }
                }
                ${SIGNIN_RESULT_FIELDS}
            `,
            () => ({
                variables: {
                    input: {
                        email: email.value,
                        password: password.value,
                    },
                },
            })
        );

        const { signIn: authSignIn } = useAuth();

        onDone(
            ({
                data: {
                    accountLocalSignin: { bearerToken, refreshToken },
                },
            }) => {
                email.value = '';
                password.value = '';
                ((form.value as unknown) as any)?.resetValidation();
                authSignIn(bearerToken, refreshToken);
                // redirect
            }
        );

        return {
            form,
            email,
            password,
            showPswd,
            canSignIn,
            required,
            isEmail,
            signIn,
            error,
        };
    },
});
</script>
