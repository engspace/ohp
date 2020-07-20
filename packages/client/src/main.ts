import VueCompositionApi from '@vue/composition-api';
import Vue from 'vue';
import App from './App.vue';
import { provideApollo } from './apollo';
import router from './router';
import { provideAuth } from './services/auth';
import { provideGoogleSignIn } from './services/google';
import { vuetify } from './vuetify';

Vue.use(VueCompositionApi);
console.log('registered vue');

Vue.config.productionTip = false;

new Vue({
    router,
    vuetify,
    setup() {
        provideApollo();
        provideAuth();
        provideGoogleSignIn({
            clientId: process.env.VUE_APP_GOOGLE_SIGNIN_CLIENT_ID as string,
        });
        return {};
    },
    render: (h) => h(App),
}).$mount('#app');
