import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import NotFoundPage from '../pages/NotFoundPage.vue';
import OrganizationPage from '../pages/OrganizationPage.vue';
import ProjectCreatePage from '../pages/ProjectCreatePage.vue';
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
        meta: {
            title: 'Sign-in',
        },
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage,
        meta: {
            title: 'Register',
        },
    },
    {
        path: '/create-project',
        name: 'Create project',
        component: ProjectCreatePage,
        meta: {
            title: 'Create Project',
        },
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

router.beforeEach((to, from, next) => {
    const ohp = 'Open-Hardware Platform';
    const pageTitle = to.meta?.title;
    if (pageTitle) {
        document.title = `${ohp} - ${pageTitle}`;
    } else {
        document.title = ohp;
    }
    next();
});

export default router;
