import { getCurrentInstance, watch, reactive } from '@vue/composition-api';
import { Dictionary } from 'vue-router/types/router';

export interface RouteHook {
    path: string;
    query: Dictionary<string | (string | null)[]>;
    params: Dictionary<string>;
}

export function useRoute(): RouteHook {
    const vm = getCurrentInstance();
    if (!vm) throw new Error('useRouter: could not get Vue instance');

    const hook = reactive({
        path: vm.$route.path,
        query: vm.$route.query,
        params: vm.$route.params,
    });

    watch(
        () => vm.$route,
        (r) => {
            hook.path = r.path;
            hook.query = r.query;
            hook.params = r.params;
        }
    );

    return hook;
}
