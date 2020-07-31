import { ControllerSet, buildControllerSet } from '@engspace/server-api';
import { AccountControl } from './account';
import { OrganizationControl } from './organization';
import { OhpUserControl } from './user';

export interface OhpControllerSet extends ControllerSet {
    account: AccountControl;
    organization: OrganizationControl;
}

export function buildOhpControllerSet(): OhpControllerSet {
    const esControl = buildControllerSet({
        user: new OhpUserControl(),
    });
    return {
        ...esControl,
        account: new AccountControl(),
        organization: new OrganizationControl(),
    };
}
