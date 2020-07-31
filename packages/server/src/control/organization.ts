import { ForbiddenError } from 'apollo-server-koa';
import { Id } from '@engspace/core';
import { Organization, OrganizationInput } from '@ohp/core';
import { OhpContext } from '..';

export class OrganizationControl {
    async create(ctx: OhpContext, input: OrganizationInput): Promise<Organization> {
        const { db, auth } = ctx;
        if (!auth.userId) {
            throw new ForbiddenError('Authentification required');
        }
        return ctx.runtime.dao.organization.create(db, input);
    }

    async byId(ctx: OhpContext, id: Id): Promise<Organization> {
        const { db } = ctx;
        return ctx.runtime.dao.organization.byId(db, id);
    }

    async byName(ctx: OhpContext, name: string): Promise<Organization> {
        const { db } = ctx;
        return ctx.runtime.dao.organization.byName(db, name);
    }

    async byUserId(ctx: OhpContext, userId: Id): Promise<Organization[]> {
        const { db } = ctx;
        return ctx.runtime.dao.organization.byUserId(db, userId);
    }
}
