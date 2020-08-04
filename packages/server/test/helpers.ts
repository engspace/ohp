import { UserInput, User } from '@engspace/core';
import { TestHelpers, DbPool, Db, Dict, asyncDictMap } from '@engspace/server-db';
import { RoleOptions } from '@engspace/server-db/dist/dao/user';
import { OhpDaoSet } from '../src/dao';

const tableDeps = {
    user: [],
    account: ['user'],
    organization: ['user'],
    organization_member: ['user', 'organization'],
    project: [],
    project_member: ['user', 'project'],
    project_member_role: ['project_member'],
    part_family: [],
    part: ['part_family', 'user'],
    part_revision: ['part', 'change_request', 'user'],
    part_validation: ['part_revision', 'user'],
    part_approval: ['part_validation', 'user'],
    change_request: ['user'],
    change_part_create: ['change_request', 'part_family'],
    change_part_fork: ['change_request', 'part'],
    change_part_revision: ['change_request', 'part'],
    change_review: ['change_request', 'user'],
    document: ['user'],
    document_revision: ['document', 'user'],
};

export class OhpTestHelpers extends TestHelpers<OhpDaoSet> {
    constructor(pool: DbPool, dao: OhpDaoSet) {
        super(pool, dao, tableDeps);
    }

    async createUser(
        db: Db,
        input: Partial<UserInput> = {},
        opts: Partial<RoleOptions> = {}
    ): Promise<User> {
        const name = 'user.name';
        const email = `${input.name ?? name}@openhardware-platform.com`;
        const withRoles = !!input.roles;

        return this.dao.user.create(
            db,
            {
                name,
                email,
                fullName: 'User Name',
                ...input,
            },
            {
                withRoles,
                ...opts,
            }
        );
    }

    async createUserWithSelfOrg(
        db: Db,
        input: Partial<UserInput> = {},
        opts: Partial<RoleOptions> = {}
    ): Promise<User> {
        const user = await this.createUser(db, input, opts);
        const org = await this.dao.organization.create(db, {
            name: user.name,
            description: 'organization of user ' + user.name,
            selfUserId: user.id,
        });
        await this.dao.organizationMember.create(db, {
            organizationId: org.id,
            userId: user.id,
            roles: ['self'],
        });
        return user;
    }

    async createUsersWithSelfOrg(
        db: Db,
        input: Dict<Partial<UserInput>>,
        opts: Partial<RoleOptions> = {}
    ): Promise<Dict<User>> {
        return asyncDictMap(input, (inp) => this.createUserWithSelfOrg(db, inp, opts));
    }
}
