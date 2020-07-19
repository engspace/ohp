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
                <v-card>
                    <v-toolbar dark color="secondary" flat>
                        <v-toolbar-title>
                            Register with e-mail and password
                        </v-toolbar-title>
                    </v-toolbar>
                    <v-card-text>
                        <v-form v-model="canRegister">
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
import { defineComponent, ref } from '@vue/composition-api';
import validator from 'validator';
import {
    GoogleUser,
    useGoogleSignIn,
    useGoogleRecaptchaV2,
} from '@/services/google';

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

        const email = ref('');
        const password = ref('');
        const showPswd = ref(false);

        const canRegister = ref(false);
        const required = (val: string) => !!val || 'Required';
        const isEmail = (val: string) =>
            (!!val && validator.isEmail(val)) || 'Enter a valid e-mail address';

        const recaptchaSiteKey = process.env.VUE_APP_GOOGLE_RECAPTCHA_SITE_KEY;
        const { getResponse } = useGoogleRecaptchaV2();

        function register() {
            // TODO
        }

        return {
            googleSignIn,
            email,
            password,
            showPswd,
            canRegister,
            required,
            isEmail,
            recaptchaSiteKey,
            register,
        };
    },
});
</script>
