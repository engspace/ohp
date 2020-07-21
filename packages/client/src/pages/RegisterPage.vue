<template>
    <v-container fluid>
        <v-row align="center" justify="center" class="ma-12">
            <v-col cols="12" sm="8" md="4">
                <v-card>
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
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="8" md="4">
                <v-card :loading="registerLoading">
                    <v-toolbar dark color="secondary" flat>
                        <v-toolbar-title>
                            Register with e-mail and password
                        </v-toolbar-title>
                    </v-toolbar>
                    <v-card-text>
                        <v-form v-model="formValid">
                            <v-text-field
                                v-model="name"
                                prepend-icon="mdi-account"
                                label="Nickname"
                                :rules="[required]"
                                dense
                            ></v-text-field>
                            <v-text-field
                                v-model="fullName"
                                prepend-icon="mdi-account"
                                label="Full name"
                                dense
                            ></v-text-field>
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
                            <div class="text-center mt-5">
                                <div
                                    id="grecaptcha-element"
                                    class="d-inline-block"
                                ></div>
                            </div>
                        </v-form>
                        <v-alert :value="!!displayedError" type="error">{{
                            displayedError
                        }}</v-alert>
                        <v-alert :value="!!confirmation" type="success">{{
                            confirmation
                        }}</v-alert>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="success"
                            :disabled="!canRegister"
                            @click="register"
                            >Register</v-btn
                        >
                        <v-spacer></v-spacer>
                        <v-subheader>Already registered?</v-subheader>
                        <v-btn to="/login" color="primary">Login</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { useMutation } from '@vue/apollo-composable';
import { computed, defineComponent, ref } from '@vue/composition-api';
import gql from 'graphql-tag';
import validator from 'validator';
import { USER_FIELDS, useUserConflicts } from '@engspace/client-comps';
import { useGoogleRecaptchaV2 } from '@/services/google-recaptcha';
import { GoogleUser, useGoogleSignIn } from '@/services/google-signin';

const ACCOUNT_FIELDS = gql`
    fragment AccountFields on Account {
        id
        type
        user {
            ...UserFields
        }
    }
    ${USER_FIELDS}
`;

export default defineComponent({
    setup() {
        const {
            signIn: googleSignIn,
            onSuccess: googleOnSuccess,
            onError: googleOnError,
        } = useGoogleSignIn();
        googleOnSuccess((usr: GoogleUser) => {
            // TODO
        });
        googleOnError((err: { error: string }) => {
            // TODO
        });

        const name = ref('');
        const fullName = ref('');
        const email = ref('');
        const password = ref('');
        const showPswd = ref(false);

        const formValid = ref(false);
        const required = (val: string) => !!val || 'Required';
        const isEmail = (val: string) =>
            (!!val && validator.isEmail(val)) || 'Enter a valid e-mail address';
        const user = computed(() => ({
            email: email.value,
            name: name.value,
        }));
        const {
            name: nameConflict,
            email: emailConflict,
            // we don't display anything if this request fails
            // error: conflictQueryError,
        } = useUserConflicts({
            user,
        });
        const nameConflictErrorMsg = computed(() => {
            if (name.value && nameConflict.value) {
                return `${name} already exists in the database`;
            }
            return '';
        });

        const emailConflictErrorMsg = computed(() => {
            if (email.value && emailConflict.value) {
                return `${email} already exists in the database`;
            }
            return '';
        });

        const { response: recaptchaResponse } = useGoogleRecaptchaV2({
            target: 'grecaptcha-element',
            siteKey: process.env.VUE_APP_GOOGLE_RECAPTCHA_SITE_KEY as string,
        });

        const canRegister = computed(
            () => formValid.value && !!recaptchaResponse.value
        );

        const {
            mutate: registerMutate,
            loading: registerLoading,
            onDone: registerOnDone,
            error: registerError,
        } = useMutation(
            gql`
                mutation CreateLocalAccount($input: LocalAccountInput!) {
                    accountCreateLocal(input: $input) {
                        ...AccountFields
                    }
                }
                ${ACCOUNT_FIELDS}
            `
        );

        const recaptchaError = ref('');

        const displayedError = computed(
            () => registerError.value?.message || recaptchaError.value
        );

        const confirmation = ref('');

        function register() {
            confirmation.value = '';
            recaptchaError.value = '';
            const rr = recaptchaResponse.value;
            if (!rr) {
                recaptchaError.value = 'You must be identified as a human';
                return;
            }
            registerMutate({
                input: {
                    name: name.value,
                    email: email.value,
                    fullName: fullName.value,
                    password: password.value,
                    recaptchaToken: rr,
                },
            });
        }

        registerOnDone(() => {
            recaptchaError.value = '';
            confirmation.value =
                'Your account has been registered but is still inactive. ' +
                'An activation link was sent to ' +
                email.value;
            name.value = '';
            email.value = '';
            fullName.value = '';
            password.value = '';
        });

        return {
            googleSignIn,
            name,
            fullName,
            email,
            password,
            showPswd,
            formValid,
            canRegister,
            required,
            isEmail,
            nameConflictErrorMsg,
            emailConflictErrorMsg,
            register,
            registerLoading,
            confirmation,
            displayedError,
        };
    },
});
</script>
