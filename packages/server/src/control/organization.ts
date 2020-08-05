import { UserInputError } from 'apollo-server-koa';
import { Id } from '@engspace/core';
import { assertUserPerm } from '@engspace/server-api';
import {
    Organization,
    OrganizationInput,
    OrganizationMember,
    OrganizationMemberInput,
    isOrganization,
} from '@ohp/core';
import { OhpContext } from '..';
import { assertUserOrOrganizationPerm } from './helper';

export class OrganizationControl {
    async create(ctx: OhpContext, input: OrganizationInput): Promise<Organization> {
        assertUserPerm(ctx, 'org.create');
        const {
            db,
            auth: { userId },
        } = ctx;
        return db.transaction(async (transacDb) => {
            const org = await ctx.runtime.dao.organization.create(transacDb, input);
            // adding user as admin
            await ctx.runtime.dao.organizationMember.create(transacDb, {
                organizationId: org.id,
                userId,
                roles: ['admin'],
            });
            return org;
        });
    }

    async byId(ctx: OhpContext, id: Id): Promise<Organization> {
        assertUserPerm(ctx, 'org.read');
        const { db } = ctx;
        return ctx.runtime.dao.organization.byId(db, id);
    }

    async byName(ctx: OhpContext, name: string): Promise<Organization> {
        assertUserPerm(ctx, 'org.read');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.organization.byName(db, name);
    }

    async bySelfUserId(ctx: OhpContext, selfUserId: string): Promise<OrganizationMember> {
        assertUserPerm(ctx, 'orgmember.read');
        const {
            db,
            runtime: { dao },
        } = ctx;
        const org = await dao.organization.bySelfUserId(db, selfUserId);
        return dao.organizationMember.byOrganizationAndUserId(db, org.id, selfUserId);
    }

    async update(ctx: OhpContext, id: Id, input: OrganizationInput): Promise<Organization> {
        await assertUserOrOrganizationPerm(ctx, id, 'org.update');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return await dao.organization.update(db, id, input);
    }

    async memberAdd(ctx: OhpContext, input: OrganizationMemberInput): Promise<OrganizationMember> {
        await assertUserOrOrganizationPerm(ctx, input.organizationId, 'orgmember.create');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.organizationMember.create(db, input);
    }

    async memberById(ctx: OhpContext, memberId: Id): Promise<OrganizationMember | null> {
        assertUserPerm(ctx, 'orgmember.read');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.organizationMember.byId(db, memberId);
    }

    memberByOrganizationAndUserId(
        ctx: OhpContext,
        organizationId: Id,
        userId: Id
    ): Promise<OrganizationMember | null> {
        assertUserPerm(ctx, 'orgmember.read');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.organizationMember.byOrganizationAndUserId(db, organizationId, userId);
    }

    membersByOrganizationId(ctx: OhpContext, orgId: Id): Promise<OrganizationMember[]> {
        assertUserPerm(ctx, 'orgmember.read');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.organizationMember.byOrganizationId(db, orgId);
    }

    membersByUserId(
        ctx: OhpContext,
        userId: Id,
        options: { includeSelf: boolean }
    ): Promise<OrganizationMember[]> {
        assertUserPerm(ctx, 'orgmember.read');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.organizationMember.byUserId(db, userId, options);
    }

    async memberUpdate(
        ctx: OhpContext,
        memberId: Id,
        roles: string[] | null
    ): Promise<OrganizationMember> {
        const {
            db,
            runtime: { dao },
        } = ctx;
        const mem = await dao.organizationMember.byId(db, memberId);
        await assertUserOrOrganizationPerm(ctx, mem.organization.id, 'orgmember.update');
        if (mem.roles?.includes('admin') && !roles?.includes('admin')) {
            const count = await dao.organizationMember.countByOrganizationIdAndRole(
                db,
                mem.organization.id,
                'admin'
            );
            if (count === 1) {
                throw new UserInputError('cannot remove the last administrator');
            }
        }
        const includesSelf = roles?.includes('self');
        const isSelf = await this.isSelf(ctx, mem);
        if (isSelf && !includesSelf) {
            throw new UserInputError('Cannot remove role "self"');
        } else if (!isSelf && includesSelf) {
            throw new UserInputError('Cannot add role "self"');
        }
        return dao.organizationMember.updateRolesById(db, memberId, roles);
    }

    async memberRemove(ctx: OhpContext, memberId: Id): Promise<OrganizationMember> {
        const {
            db,
            auth: { userId },
            runtime: { dao },
        } = ctx;
        const mem = await dao.organizationMember.byId(db, memberId);
        // allow to self remove from an organization without permission
        if (userId && mem.user.id !== userId) {
            await assertUserOrOrganizationPerm(ctx, mem.organization.id, 'orgmember.delete');
        }
        // disallow to remove the last "admin" role member
        if (mem.roles?.includes('admin')) {
            const adminCount = await dao.organizationMember.countByOrganizationIdAndRole(
                db,
                mem.organization.id,
                'admin'
            );
            if (adminCount === 1) {
                throw new UserInputError('Cannot remove the last administrator');
            }
        }
        // disallow to remove from self organization
        if (await this.isSelf(ctx, mem)) {
            throw new UserInputError('Cannot remove user from self organization');
        }
        return dao.organizationMember.deleteById(db, memberId);
    }

    private async isSelf(
        { db, runtime: { dao } }: OhpContext,
        mem: OrganizationMember
    ): Promise<boolean> {
        if (!isOrganization(mem.organization)) {
            mem.organization = await dao.organization.byId(db, mem.organization.id);
        }
        return (mem.organization as Organization).selfUser?.id === mem.user.id;
    }
}
