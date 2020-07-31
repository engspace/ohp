import {
    ref,
    computed,
    Ref,
    provide,
    inject,
    InjectionKey,
    watch,
} from '@vue/composition-api';
import jwtDecode from 'jwt-decode';
import { Id } from '@engspace/core';
import { TokenPayload } from '@ohp/core';
import { api } from '@/api';

const refreshTokenKey = 'refresh-token';
const lastPayloadKey = 'last-payload';
let mutableBearerToken = '';

/**
 * Login token
 */
export function bearerToken(): string | null {
    return mutableBearerToken;
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
    signIn: (bearerToken: string, refreshToken: string) => void;
    signOut: () => void;
}

const AuthSymbol: InjectionKey<AuthStore> = Symbol();

/**
 * Provide reactive authentification information to Vue
 */
export function provideAuth(): void {
    const mutToken = ref(bearerToken());
    const payload = computed(() => {
        if (mutToken.value) {
            return jwtDecode(mutToken.value) as TokenPayload;
        } else {
            // using last payload to avoid transient state during init
            // while refresh token is flying during
            const storage = localStorage.getItem(lastPayloadKey);
            if (storage) {
                return JSON.parse(storage) as TokenPayload;
            }
        }
        return null;
    });

    const token = computed(() => mutToken.value);
    const signedIn = computed(() => !!payload.value);
    const userId = computed(() => payload.value?.sub);
    const userName = computed(() => payload.value?.name);
    const userPicture = computed(() => payload.value?.picture);
    const header = computed(() =>
        mutToken.value
            ? {
                  Authorization: `Bearer ${mutToken.value}`,
              }
            : {}
    );

    function signIn(bearerToken: string, refreshToken: string) {
        localStorage.setItem(refreshTokenKey, refreshToken);
        mutableBearerToken = bearerToken;
        mutToken.value = bearerToken;
    }

    function signOut() {
        localStorage.removeItem(lastPayloadKey);
        localStorage.removeItem(refreshTokenKey);
        mutableBearerToken = '';
        mutToken.value = '';
    }

    async function refreshToken() {
        const tok = localStorage.getItem(refreshTokenKey);
        if (tok) {
            try {
                const {
                    status,
                    data: { newBearerToken, newRefreshToken },
                } = await api.post('/api/refresh_token', {
                    refreshToken: tok,
                });
                if (status === 200) {
                    signIn(newBearerToken, newRefreshToken);
                    return;
                }
            } catch (err) {
                console.error(err);
                //
            }
        }
        signOut();
    }

    watch(payload, (pl) => {
        if (!pl) {
            localStorage.removeItem(lastPayloadKey);
            return;
        } else {
            localStorage.setItem(lastPayloadKey, JSON.stringify(pl));
        }
        // refresh token 10s before expiration
        const ms = pl.exp * 1000 - Date.now() - 10000;
        setTimeout(refreshToken, ms > 0 ? ms : 0);
    });

    // try to signin from previous session
    refreshToken();

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
