import { EsDaoSet, buildEsDaoSet } from '@engspace/server-db';
import { AccountDao } from './account';
import { OrganizationDao } from './organization';
import { OrganizationMemberDao } from './organization-member';
import { OhpProjectDao } from './project';

export interface OhpDaoSet extends EsDaoSet {
    account: AccountDao;
    organization: OrganizationDao;
    organizationMember: OrganizationMemberDao;
}

export function buildOhpDaoSet(): OhpDaoSet {
    const dao = buildEsDaoSet({
        project: new OhpProjectDao(),
    });
    return {
        ...dao,
        account: new AccountDao(),
        organization: new OrganizationDao(),
        organizationMember: new OrganizationMemberDao(),
    };
}
