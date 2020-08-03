import { computed, onMounted, ref } from '@vue/composition-api';
import { useScript } from './dom';

declare global {
    interface Window {
        grecaptchaApiLoaded(): void;
    }
}

let loaded = false;
let loadedCallback: (() => void) | undefined;

window.grecaptchaApiLoaded = (): void => {
    loaded = true;
    if (loadedCallback) loadedCallback();
    loadedCallback = undefined;
};

interface Options {
    target: HTMLElement | string;
    siteKey: string;
    theme?: 'light' | 'dark';
    size?: 'compact' | 'normal';
}

export function useGoogleRecaptchaV2({
    target,
    siteKey,
    theme = 'light',
    size = 'normal',
}: Options) {
    let loadCb: () => void;
    let successCb: (response: string) => void;
    let expiredCb: () => void;

    function onLoad(cb: () => void) {
        loadCb = cb;
    }
    function onSuccess(cb: (response: string) => void) {
        successCb = cb;
    }
    function onExpired(cb: () => void) {
        expiredCb = cb;
    }

    let widgetId: number | null = null;

    const mutResponse = ref('');
    const response = computed(() => mutResponse.value);

    function render() {
        widgetId = grecaptcha.render(target, {
            sitekey: siteKey,
            theme,
            size,
            callback: (resp: string) => {
                mutResponse.value = resp;
                if (successCb) successCb(resp);
            },
            'expired-callback': () => {
                mutResponse.value = '';
                if (expiredCb) expiredCb();
            },
        });
    }

    function reset() {
        if (typeof widgetId === 'number') {
            mutResponse.value = '';
            grecaptcha.reset(widgetId);
        }
    }

    function performInit() {
        if (loadCb) loadCb();
        render();
    }

    onMounted(async () => {
        if (loaded) {
            performInit();
        } else {
            loadedCallback = performInit;
            await useScript({
                src:
                    'https://www.google.com/recaptcha/api.js?onload=grecaptchaApiLoaded&render=explicit',
                defer: true,
            });
        }
    });

    return { onLoad, onSuccess, onExpired, reset, render, response };
}
