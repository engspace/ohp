import { UserInput, User } from '@engspace/core';
import {
    TestHelpers,
    DbPool,
    Db,
    Dict,
    asyncDictMap,
    esTableDeps,
    RoleOptions,
} from '@engspace/server-db';
import { OrganizationInput, Organization } from '@ohp/core';
import { OhpDaoSet } from '../src/dao';

export interface OrgInputWithMembers extends OrganizationInput {
    members: { user: User; roles?: string[] }[];
}

const ohpTableDeps = {
    ...esTableDeps,
    user: [],
    account: ['user'],
    organization: ['user'],
    organization_member: ['user', 'organization'],
};

export class OhpTestHelpers extends TestHelpers<OhpDaoSet> {
    constructor(pool: DbPool, dao: OhpDaoSet) {
        super(pool, dao, ohpTableDeps);
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

    async createOrg(db: Db, input: Partial<OrgInputWithMembers> = {}): Promise<Organization> {
        const name = input.name || 'org';

        const org = await this.dao.organization.create(db, {
            name,
            description: input.description || null,
            selfUserId: input.selfUserId,
        });
        if (input.members) {
            org.members = await Promise.all(
                input.members.map(({ user, roles }) =>
                    this.dao.organizationMember.create(db, {
                        organizationId: org.id,
                        userId: user.id,
                        roles,
                    })
                )
            );
        }
        return org;
    }
}
