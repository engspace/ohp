export interface ScriptOptions {
    src: string;
    defer?: boolean;
    skipPresenceCheck?: boolean;
    onLoad?: () => void;
}

export function useScript({
    src,
    defer,
    skipPresenceCheck,
    onLoad,
}: ScriptOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (skipPresenceCheck !== true) {
            const scripts = document.getElementsByTagName('script');
            for (const s of scripts) {
                if (s.src === src) {
                    resolve(false);
                    return;
                }
            }
        }
        const script = document.createElement('script');
        script.onload = () => {
            if (onLoad) onLoad();
            resolve(true);
        };
        script.onerror = (err) => reject(err);
        script.setAttribute('src', src);
        if (defer) {
            script.setAttribute('defer', '');
        }
        document.head.appendChild(script);
    });
}
