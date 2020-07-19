import { ControllerSet, buildControllerSet } from '@engspace/server-api';
import { OhpDaoSet } from '../dao';
import { AccountControl } from './account';

export interface OhpControllerSet extends ControllerSet {
    account: AccountControl;
}

export function buildOhpControllerSet(dao: OhpDaoSet): OhpControllerSet {
    const esControl = buildControllerSet(dao);
    return {
        ...esControl,
        account: new AccountControl(dao),
    };
}
