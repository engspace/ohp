import VueCompositionApi from '@vue/composition-api';
import Vue from 'vue';
import App from './App.vue';
import { provideApollo } from './apollo';
import env from './env';
import router from './router';
import { provideAuth } from './services/auth';
import { provideGoogleSignIn } from './services/google-signin';
import { vuetify } from './vuetify';

Vue.use(VueCompositionApi);
Vue.config.productionTip = false;

new Vue({
    router,
    vuetify,
    setup() {
        provideApollo();
        provideAuth();
        provideGoogleSignIn({
            clientId: env.googleSigninClientId,
        });
        return {};
    },
    render: (h) => h(App),
}).$mount('#app');
