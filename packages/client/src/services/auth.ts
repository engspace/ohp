import {
    ref,
    computed,
    Ref,
    provide,
    inject,
    InjectionKey,
} from '@vue/composition-api';
import jwtDecode from 'jwt-decode';
import { Id } from '@engspace/core';
import { TokenPayload } from '@ohp/core';

const storageKey = 'bearer-token';

/**
 * Login token
 */
export function bearerToken(): string | null {
    return localStorage.getItem(storageKey);
}

/**
 * Whether user is signed-in
 */
export function signedIn(): boolean {
    return !!bearerToken();
}

/**
 * Sets Authorization on the returned header only if user is signed-in.
 */
export function optionalHeader(): { Authorization?: string } {
    const token = bearerToken();
    if (token) return { Authorization: `Bearer ${token}` };
    else return {};
}

/**
 * Sets Authorization on the returned header if user is signed-in, or fails.
 */
export function requiredHeader(): { Authorization: string } {
    const token = bearerToken();
    if (!token) {
        throw new Error('Unauthenticated API call');
    }
    return { Authorization: `Bearer ${token}` };
}

interface AuthStore {
    token: Ref<Readonly<string>>;
    signedIn: Ref<Readonly<boolean>>;
    userId: Ref<Readonly<Id>>;
    userName: Ref<Readonly<string>>;
    userPicture: Ref<Readonly<string>>;
    header: Ref<Readonly<{ Authorization?: string }>>;
    signIn: (bearerToken: string) => void;
    signOut: () => void;
}

const AuthSymbol: InjectionKey<AuthStore> = Symbol();

/**
 * Provide reactive authentification information to Vue
 */
export function provideAuth(): void {
    const mutToken = ref(bearerToken() || '');
    const payload = computed(() =>
        mutToken.value ? (jwtDecode(mutToken.value) as TokenPayload) : null
    );

    const token = computed(() => mutToken.value);
    const signedIn = computed(() => !!payload.value);
    const userId = computed(() => payload.value?.sub);
    const userName = computed(() => payload.value?.name);
    const userPicture = computed(() => payload.value?.picture);
    const header = computed(() =>
        mutToken.value
            ? {
                  Authorization: mutToken.value,
              }
            : {}
    );

    function signIn(token: string) {
        localStorage.setItem(storageKey, token);
        mutToken.value = token;
    }

    function signOut() {
        mutToken.value = '';
        localStorage.removeItem(storageKey);
    }

    provide(AuthSymbol, {
        token,
        signedIn,
        userId,
        userName,
        userPicture,
        header,
        signIn,
        signOut,
    });
}

/**
 * Authentification hook
 */
export function useAuth(): AuthStore {
    const store = inject(AuthSymbol);
    if (!store) throw new Error('provideAuth not called');
    return store;
}
