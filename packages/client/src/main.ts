import VueCompositionApi from '@vue/composition-api';
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import { provideGoogleSignIn } from './services/google';
import { vuetify } from './vuetify';

Vue.config.productionTip = false;
Vue.use(VueCompositionApi);

new Vue({
    router,
    vuetify,
    setup() {
        provideGoogleSignIn({
            clientId: process.env.VUE_APP_GOOGLE_SIGNIN_CLIENT_ID,
        });
        return {};
    },
    render: (h) => h(App),
}).$mount('#app');
