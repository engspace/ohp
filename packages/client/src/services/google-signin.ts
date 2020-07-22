import { onMounted, ref, provide, inject, Ref } from '@vue/composition-api';
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

    const user: Ref<GoogleUser | null> = ref(null);
    const error = ref('');

    let successCb: (usr: GoogleUser) => void;
    let errorCb: (err: { error: string }) => void;

    function onSuccess(cb: (usr: GoogleUser) => void) {
        successCb = cb;
    }

    function onError(cb: (err: { error: string }) => void) {
        errorCb = cb;
    }

    async function signIn(opts?: gapi.auth2.SigninOptions): Promise<void> {
        error.value = '';
        user.value = null;
        let usr;
        try {
            usr = (await gsi.auth?.signIn(opts)) as GoogleUser;
        } catch (err) {
            error.value = '';
            errorCb(err);
            return;
        }
        user.value = usr;
        successCb(usr);
    }

    async function signOut(): Promise<void> {
        error.value = '';
        user.value = null;
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

    return {
        isSignedIn,
        error,
        user,
        signIn,
        signOut,
        renderBtn,
        onSuccess,
        onError,
    };
}
