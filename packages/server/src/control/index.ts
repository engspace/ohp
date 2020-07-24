import { ControllerSet, buildControllerSet } from '@engspace/server-api';
import { DbPool } from '@engspace/server-db';
import { OhpDaoSet } from '../dao';
import { AccountControl } from './account';

export interface OhpControllerSet extends ControllerSet {
    account: AccountControl;
}

export function buildOhpControllerSet(dao: OhpDaoSet, pool: DbPool): OhpControllerSet {
    const esControl = buildControllerSet(dao);
    return {
        ...esControl,
        account: new AccountControl(dao, pool),
    };
}
