import { onMounted, ref, provide, inject } from '@vue/composition-api';
import { useScript } from './script';

export type GoogleUser = gapi.auth2.GoogleUser;
export type SigninOptions = gapi.auth2.SigninOptions;

const GoogleSignInSymbol = Symbol();

interface GoogleSignIn {
    auth: gapi.auth2.GoogleAuth | null;
    clientId: string;
}

export function provideGoogleSignIn({ clientId }: { clientId: string }) {
    provide(GoogleSignInSymbol, {
        auth: null,
        clientId,
    });
}

export function useGoogleSignIn({
    signinOpts,
}: {
    signinOpts?: SigninOptions;
} = {}) {
    const gsi = inject(GoogleSignInSymbol) as GoogleSignIn;

    const isSignedIn = ref(false);

    function renderBtn(id: string, options: any) {
        gapi.signin2.render(id, options);
    }

    let successCb: (usr: GoogleUser) => void;
    let errorCb: (err: { error: string }) => void;

    function onSuccess(cb: (usr: GoogleUser) => void) {
        successCb = cb;
    }

    function onError(cb: (err: { error: string }) => void) {
        errorCb = cb;
    }

    async function signIn(opts?: gapi.auth2.SigninOptions): Promise<void> {
        let usr;
        try {
            usr = (await gsi.auth?.signIn(opts)) as GoogleUser;
        } catch (err) {
            errorCb(err);
            return;
        }
        successCb(usr);
    }

    async function signOut(): Promise<void> {
        await gsi.auth?.signOut();
    }

    function initSignedIn(auth: gapi.auth2.GoogleAuth) {
        isSignedIn.value = auth.isSignedIn.get();
        auth.isSignedIn.listen((signedIn: boolean) => {
            isSignedIn.value = signedIn;
        });
    }

    if (!gsi.auth) {
        onMounted(async () => {
            await useScript({
                src: 'https://apis.google.com/js/platform.js',
                defer: true,
                onLoad: () => {
                    gapi.load('auth2', () => {
                        gapi.auth2.init({
                            client_id: gsi.clientId,
                            ...signinOpts,
                        });
                        gsi.auth = gapi.auth2.getAuthInstance();
                        initSignedIn(gsi.auth);
                    });
                },
            });
        });
    } else {
        initSignedIn(gsi.auth);
    }

    return { isSignedIn, signIn, signOut, renderBtn, onSuccess, onError };
}

export function useGoogleRecaptchaV2() {
    let loadCb: () => void;
    function onLoad(cb: () => void) {
        loadCb = cb;
    }

    function render(containerId: string, parameters: any): number {
        return grecaptcha.render(containerId, parameters);
    }

    function reset(widgetId?: number) {
        grecaptcha.reset(widgetId);
    }

    function getResponse(widgetId?: number) {
        return grecaptcha.getResponse(widgetId);
    }

    onMounted(async () => {
        await useScript({
            src: 'https://www.google.com/recaptcha/api.js',
            defer: true,
        });
        if (loadCb) {
            loadCb();
        }
    });

    return { onLoad, render, reset, getResponse };
}
