import { onMounted, ref } from '@vue/composition-api';

export type GoogleUser = gapi.auth2.GoogleUser;
export type SigninOptions = gapi.auth2.SigninOptions;

export function useGoogleSignIn({
    clientId,
    signinOpts,
}: {
    clientId: string;
    signinOpts?: SigninOptions;
}) {
    let gauth: gapi.auth2.GoogleAuth;

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
            usr = await gauth.signIn(opts);
        } catch (err) {
            errorCb(err);
            return;
        }
        successCb(usr);
    }

    async function signOut(): Promise<void> {
        await gauth.signOut();
    }

    onMounted(() => {
        const script = document.createElement('script');
        script.onload = () => {
            gapi.load('auth2', () => {
                gapi.auth2.init({
                    client_id: clientId,
                    ...signinOpts,
                });
                gauth = gapi.auth2.getAuthInstance();
                isSignedIn.value = gauth.isSignedIn.get();
                gauth.isSignedIn.listen((signedIn: boolean) => {
                    isSignedIn.value = signedIn;
                });
            });
        };
        script.setAttribute('src', 'https://apis.google.com/js/platform.js');
        script.setAttribute('defer', '');
        document.head.appendChild(script);
    });
    return { isSignedIn, signIn, signOut, renderBtn, onSuccess, onError };
}
