import { DaoSet, buildDaoSet } from '@engspace/server-db';
import { AccountDao } from './account';
import { OrganizationDao } from './organization';
import { OhpProjectDao } from './project';

export interface OhpDaoSet extends DaoSet {
    account: AccountDao;
    organization: OrganizationDao;
}

export function buildOhpDaoSet(): OhpDaoSet {
    const dao = buildDaoSet({
        project: new OhpProjectDao(),
    });
    return {
        ...dao,
        account: new AccountDao(),
        organization: new OrganizationDao(),
    };
}
