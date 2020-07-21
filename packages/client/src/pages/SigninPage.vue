<template>
    <v-container>
        <v-row align="center" justify="center" class="ma-12">
            <v-col cols="12" sm="8" md="4" lg="3">
                <provider-signin-card></provider-signin-card>
            </v-col>
        </v-row>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="8" md="4" lg="3">
                <v-card>
                    <v-toolbar dark color="primary" flat>
                        <v-toolbar-title>
                            Sign-in with e-mail and password
                        </v-toolbar-title>
                    </v-toolbar>
                    <v-card-text>
                        <v-form v-model="canSignIn">
                            <v-text-field
                                v-model="email"
                                prepend-icon="mdi-at"
                                label="E-mail"
                                :rules="[required]"
                                dense
                            ></v-text-field>
                            <v-text-field
                                v-model="password"
                                label="Password"
                                :rules="[required, isEmail]"
                                prepend-icon="mdi-lock"
                                :append-icon="
                                    showPswd ? 'mdi-eye' : 'mdi-eye-off'
                                "
                                :type="showPswd ? 'text' : 'password'"
                                dense
                                @click:append="showPswd = !showPswd"
                            ></v-text-field>
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
import { defineComponent, ref } from '@vue/composition-api';
import validator from 'validator';
import ProviderSigninCard from '@/components/ProviderSigninCard';

export default defineComponent({
    components: {
        ProviderSigninCard,
    },
    setup() {
        const email = ref('');
        const password = ref('');
        const showPswd = ref(false);

        const canSignIn = ref(false);
        const required = (val: string) => !!val || 'Required';
        const isEmail = (val: string) =>
            (!!val && validator.isEmail(val)) || 'Enter a valid e-mail address';

        function signIn() {
            // TODO
        }

        return {
            email,
            password,
            showPswd,
            canSignIn,
            required,
            isEmail,
            signIn,
        };
    },
});
</script>
