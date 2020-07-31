import { EsControlSet, buildEsControlSet } from '@engspace/server-api';
import { AccountControl } from './account';
import { OrganizationControl } from './organization';
import { OhpProjectControl } from './project';
import { OhpUserControl } from './user';

export interface OhpControlSet extends EsControlSet {
    account: AccountControl;
    organization: OrganizationControl;
}

export function buildOhpControlSet(): OhpControlSet {
    const esControl = buildEsControlSet({
        user: new OhpUserControl(),
        project: new OhpProjectControl(),
    });
    return {
        ...esControl,
        account: new AccountControl(),
        organization: new OrganizationControl(),
    };
}
