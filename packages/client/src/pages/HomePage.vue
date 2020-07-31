<template>
    <div>
        <v-navigation-drawer v-if="signedIn" app permanent clipped>
            <v-list>
                <v-list-item to="/create-project" link>
                    <v-list-item-icon>
                        <v-icon>mdi-plus</v-icon>
                        <v-list-item-content>
                            <v-list-item-title>
                                Create Project
                            </v-list-item-title>
                        </v-list-item-content>
                    </v-list-item-icon>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>
        <div class="text-center">
            <h1>
                Welcome to

                <span id="ohpurl">openhardware-platform.com</span>!
            </h1>
            <h2>Collaborative engineering and Open Innovation platform</h2>
            <p>Currently building-up...</p>
        </div>
    </div>
</template>

<script>
import { useAuth } from '../services/auth';
export default {
    name: 'Home',
    setup() {
        const { signedIn } = useAuth();
        return { signedIn };
    },
};
</script>

<style>
#ohpurl {
    font-family: 'Fira Code', 'Lucida Console', Monaco, monospace;
    opacity: 83%;
}
</style>
