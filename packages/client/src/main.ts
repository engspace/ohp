import VueCompositionApi from '@vue/composition-api';
import Vue from 'vue';
import EsComps from '@engspace/client-comps';
import App from './App.vue';
import env from './env';
import router from './router';
import { provideApollo } from './services/apollo';
import { provideAuth } from './services/auth';
import { provideGoogleSignIn } from './services/google-signin';
import { vuetify } from './vuetify';

Vue.use(VueCompositionApi);
Vue.use(EsComps);
Vue.config.productionTip = false;

new Vue({
    router,
    vuetify,
    setup() {
        provideAuth();
        provideApollo();
        provideGoogleSignIn({
            clientId: env.googleSigninClientId,
        });
        return {};
    },
    render: (h) => h(App),
}).$mount('#app');
