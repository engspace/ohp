import { ControllerSet, buildControllerSet } from '@engspace/server-api';
import { OhpDaoSet } from '../dao';
import { AccountControl } from './account';
import { OrganizationControl } from './organization';

export interface OhpControllerSet extends ControllerSet {
    account: AccountControl;
    organization: OrganizationControl;
}

export function buildOhpControllerSet(dao: OhpDaoSet): OhpControllerSet {
    const esControl = buildControllerSet(dao);
    return {
        ...esControl,
        account: new AccountControl(),
        organization: new OrganizationControl(),
    };
}
