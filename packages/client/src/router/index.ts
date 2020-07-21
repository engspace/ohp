import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import SigninPage from '../pages/SigninPage.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Home',
        component: HomePage,
    },
    {
        path: '/signin',
        name: 'Sign-in',
        component: SigninPage,
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage,
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;
