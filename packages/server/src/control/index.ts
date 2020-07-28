import { AppRolePolicies } from '@engspace/core';
import { ControllerSet, buildControllerSet } from '@engspace/server-api';
import { DbPool } from '@engspace/server-db';
import { OhpDaoSet } from '../dao';
import { AccountControl } from './account';
import { OrganizationControl } from './organization';

export interface OhpControllerSet extends ControllerSet {
    account: AccountControl;
    organization: OrganizationControl;
}

export function buildOhpControllerSet(
    dao: OhpDaoSet,
    pool: DbPool,
    rolePolices: AppRolePolicies
): OhpControllerSet {
    const esControl = buildControllerSet(dao);
    return {
        ...esControl,
        account: new AccountControl(dao, pool, rolePolices),
        organization: new OrganizationControl(dao),
    };
}
