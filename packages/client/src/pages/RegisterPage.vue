<template>
    <v-container fluid>
        <v-row align="center" justify="center" class="my-12">
            <v-col cols="12" sm="8" md="5" xl="3">
                <provider-signin-card register-mode></provider-signin-card>
            </v-col>
        </v-row>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="8" md="5" xl="3">
                <v-card :loading="registerLoading">
                    <v-toolbar dark color="secondary" flat>
                        <v-toolbar-title>
                            Register with e-mail and password
                        </v-toolbar-title>
                    </v-toolbar>
                    <v-card-text>
                        <v-form ref="form" v-model="formValid">
                            <v-text-field
                                v-model="name"
                                prepend-icon="mdi-account"
                                label="pseudo"
                                prefix="@"
                                :rules="[required]"
                                :error-messages="nameConflictErrorMsg"
                                dense
                                class="required"
                                required
                            >
                            </v-text-field>
                            <v-text-field
                                v-model="fullName"
                                prepend-icon="mdi-account"
                                label="Full name - optional"
                                dense
                            ></v-text-field>
                            <v-text-field
                                v-model="email"
                                prepend-icon="mdi-at"
                                label="E-mail"
                                :rules="[required, isEmail]"
                                :error-messages="emailConflictErrorMsg"
                                dense
                                class="required"
                                required
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
                                required
                                class="required"
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
                        <v-btn to="/signin" color="primary">Sign-in</v-btn>
                        <v-snackbar
                            :value="!!confirmation"
                            app
                            color="success"
                            multi-line
                            :timeout="10000"
                            @input="confirmation = ''"
                        >
                            Your account has been created but is inactive. An
                            activation link was sent to {{ confirmation }}.
                            <template v-slot:action="{ attrs }">
                                <v-btn to="/signin" text v-bind="attrs">
                                    Take me to signin
                                </v-btn>
                                <v-btn
                                    text
                                    v-bind="attrs"
                                    @click="confirmation = ''"
                                >
                                    Close
                                </v-btn>
                            </template>
                        </v-snackbar>
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
import { useUserConflicts } from '@engspace/client-comps';
import ProviderSigninCard from '@/components/ProviderSigninCard.vue';
import { ACCOUNT_FIELDS } from '@/graphql';
import { useGoogleRecaptchaV2 } from '@/services/google-recaptcha';

export default defineComponent({
    components: {
        ProviderSigninCard,
    },
    setup() {
        const form = ref(null);
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
                return `${name.value} already exists in the database`;
            }
            return '';
        });

        const emailConflictErrorMsg = computed(() => {
            if (email.value && emailConflict.value) {
                return `${email.value} already exists in the database`;
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

        // set with the email
        const confirmation = ref('');

        function register() {
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
            confirmation.value = email.value;
            recaptchaError.value = '';
            name.value = '';
            email.value = '';
            fullName.value = '';
            password.value = '';
            ((form.value as unknown) as any)?.resetValidation();
        });

        return {
            form,
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
