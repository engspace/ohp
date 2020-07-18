<template>
    <v-container fluid class="fill-height">
        <v-row align="center" justify="center">
            <v-col cols="12" sm="8" md="4">
                <v-card>
                    <v-toolbar dark color="primary" flat>
                        <v-toolbar-title>
                            Sign-in to
                            <span class="es-logo text--secondary">{ohp}</span>
                        </v-toolbar-title>
                    </v-toolbar>
                    <v-card-text>
                        <v-btn class="ma-8" @click="signIn">
                            <v-icon left>mdi-google</v-icon>
                            Using Google
                        </v-btn>
                        <v-divider></v-divider>
                        <span>Using e-mail and password</span>
                    </v-card-text>
                    <v-card-actions>
                        <span>Not registered yet?</span>
                        <v-btn to="/register" color="primary">Register</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { GoogleUser, useGoogleSignIn } from './login-page';

export default defineComponent({
    setup() {
        const { signIn, onSuccess, onError } = useGoogleSignIn({
            clientId: process.env.VUE_APP_GOOGLE_SIGNIN_CLIENT_ID,
        });
        onSuccess((usr: GoogleUser) => {
            const profile = usr.getBasicProfile();
            console.log('signed-in!');
            console.log('ID: ' + profile.getId());
            console.log('Full Name: ' + profile.getName());
            console.log('Given Name: ' + profile.getGivenName());
            console.log('Family Name: ' + profile.getFamilyName());
            console.log('Image URL: ' + profile.getImageUrl());
            console.log('Email: ' + profile.getEmail());
        });
        onError((err: { error: string }) => {
            console.log('sign-in error');
            console.log(err);
        });
        return { signIn };
    },
});
</script>
