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
                        <v-form v-model="canRegister">
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
                                    class="g-recaptcha d-inline-block"
                                    :data-sitekey="recaptchaSiteKey"
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
                            color="secondary"
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
import {
    GoogleUser,
    useGoogleSignIn,
    useGoogleRecaptchaV2,
} from '@/services/google';

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
        console.log('in setup');
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

        console.log('in setup 1');
        const name = ref('');
        const fullName = ref('');
        const email = ref('');
        const password = ref('');
        const showPswd = ref(false);
        console.log('in setup 2');

        const canRegister = ref(false);
        const required = (val: string) => !!val || 'Required';
        const isEmail = (val: string) =>
            (!!val && validator.isEmail(val)) || 'Enter a valid e-mail address';
        const user = computed(() => ({
            email: email.value,
            name: name.value,
        }));
        console.log('in setup 3');
        const {
            name: nameConflict,
            email: emailConflict,
            // we don't display anything if this request fails
            // error: conflictQueryError,
        } = useUserConflicts({
            user,
        });
        console.log('in setup 4');
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

        const recaptchaSiteKey = process.env.VUE_APP_GOOGLE_RECAPTCHA_SITE_KEY;
        const { getResponse: getRecaptchaResponse } = useGoogleRecaptchaV2();

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
            () => /*registerError.value?.message || */ recaptchaError.value
        );

        const confirmation = ref('');

        function register() {
            confirmation.value = '';
            recaptchaError.value = '';
            const rr = getRecaptchaResponse();
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
                'Your account has been registered but is still inactive\n' +
                'An activation link was sent to ' +
                email.value;
        });
        console.log('out setup');

        return {
            googleSignIn,
            name,
            fullName,
            email,
            password,
            showPswd,
            canRegister,
            required,
            isEmail,
            nameConflictErrorMsg,
            emailConflictErrorMsg,
            recaptchaSiteKey,
            register,
            registerLoading,
            confirmation,
            displayedError,
        };
    },
});
</script>
