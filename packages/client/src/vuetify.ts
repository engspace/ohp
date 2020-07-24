import '@mdi/font/css/materialdesignicons.css';
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import OhpLogo from '@/icons/OhpLogo.vue';

Vue.use(Vuetify);

export const vuetify = new Vuetify({
    icons: {
        iconfont: 'mdi',
        values: {
            ohplogo: {
                component: OhpLogo,
            },
        },
    },
    theme: {
        themes: {
            light: {
                primary: '#344955',
                secondary: '#F9AA33',
            },
        },
        options: {
            customProperties: true,
        },
    },
});
