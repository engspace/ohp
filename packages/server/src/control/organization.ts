import { UserInputError } from 'apollo-server-koa';
import { Id } from '@engspace/core';
import { assertUserPerm } from '@engspace/server-api';
import {
    Organization,
    OrganizationInput,
    OrganizationMember,
    OrganizationMemberInput,
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
            // adding user as owner
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
        const { db } = ctx;
        return ctx.runtime.dao.organization.byName(db, name);
    }

    async byUserId(ctx: OhpContext, userId: Id): Promise<Organization[]> {
        assertUserPerm(ctx, 'org.read');
        const { db } = ctx;
        return ctx.runtime.dao.organization.byUserId(db, userId);
    }

    async addMember(ctx: OhpContext, input: OrganizationMemberInput): Promise<OrganizationMember> {
        await assertUserOrOrganizationPerm(ctx, input.organizationId, 'member.create');
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

    membersByOrganizationId(ctx: OhpContext, projId: Id): Promise<OrganizationMember[]> {
        assertUserPerm(ctx, 'orgmember.read');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.organizationMember.byOrganizationId(db, projId);
    }

    membersByUserId(ctx: OhpContext, userId: Id): Promise<OrganizationMember[]> {
        assertUserPerm(ctx, 'orgmember.read');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.organizationMember.byUserId(db, userId);
    }

    async updateMemberRoles(
        ctx: OhpContext,
        memberId: Id,
        roles: string[]
    ): Promise<OrganizationMember> {
        const {
            db,
            runtime: { dao },
        } = ctx;
        const mem = await dao.organizationMember.byId(db, memberId);
        await assertUserOrOrganizationPerm(ctx, mem.organization.id, 'orgmember.update');
        const includesSelf = roles.includes('self');
        const isSelf = await this.isSelf(ctx, mem.organization.id, mem.user.id);
        if (isSelf && !includesSelf) {
            throw new UserInputError('Cannot remove role "self"');
        } else if (!isSelf && includesSelf) {
            throw new UserInputError('Cannot add role "self"');
        }
        return dao.organizationMember.updateRolesById(db, memberId, roles);
    }

    async deleteMember(ctx: OhpContext, memberId: Id): Promise<OrganizationMember> {
        const {
            db,
            runtime: { dao },
        } = ctx;
        const mem = await dao.organizationMember.byId(db, memberId);
        await assertUserOrOrganizationPerm(ctx, mem.organization.id, 'orgmember.delete');
        if (await this.isSelf(ctx, mem.organization.id, mem.user.id)) {
            throw new UserInputError('Cannot remove user from self organization');
        }
        return dao.organizationMember.deleteById(db, memberId);
    }

    private async isSelf(
        { db, runtime: { dao } }: OhpContext,
        organizationId: Id,
        userId: Id
    ): Promise<boolean> {
        const user = await dao.user.byId(db, userId);
        return user.organization.id === organizationId;
    }
}
