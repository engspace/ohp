<template>
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
        <v-card-footer>
            <v-alert v-if="error" type="error">{{ error }}</v-alert>
        </v-card-footer>
    </v-card>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useAuth } from '@/services/auth';
import { useOhpGoogleSignIn } from '@/services/google-signin';

export default defineComponent({
    setup() {
        const { signIn } = useAuth();

        const {
            signIn: googleSignIn,
            onDone: googleOnDone,
            error,
        } = useOhpGoogleSignIn();

        googleOnDone((data) => {
            console.log(data);
        });

        return {
            googleSignIn,
            error,
        };
    },
});
</script>
