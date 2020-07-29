<template>
    <v-app id="app">
        <v-app-bar app clipped-left color="primary" dark>
            <router-link tag="span" to="/" class="ohp-logo font-weight-medium">
                <v-icon color="secondary" large>$vuetify.icons.ohplogo</v-icon>
                &lt;ohp&gt;
            </router-link>
            <v-spacer></v-spacer>
            <span v-if="signedIn">
                <v-btn text class="font-weight-bold"> @{{ userName }} </v-btn>
            </span>
            <span v-else>
                <v-btn to="/signin" light>Sign-in</v-btn>
                <span class="mx-3" style="opacity: 60%;">or</span>
                <v-btn to="/register" light>Register</v-btn>
            </span>
        </v-app-bar>
        <v-main>
            <router-view />
        </v-main>
    </v-app>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useAuth } from '@/services/auth';

export default defineComponent({
    setup() {
        const { signedIn, userName, userPicture } = useAuth();
        //
        return {
            signedIn,
            userName,
            userPicture,
        };
    },
});
</script>

<style>
#app {
    font-family: Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
.ohp-logo {
    font-family: 'Fira Code', 'Lucida Console', Monaco, monospace;
    font-size: 1.5em;
    cursor: pointer;
    color: var(--v-secondary-base);
}
.required label::after {
    content: ' *';
    color: var(--v-error-base);
}
</style>
