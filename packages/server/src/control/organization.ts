import { ForbiddenError } from 'apollo-server-koa';
import { Id } from '@engspace/core';
import { ApiContext } from '@engspace/server-api';
import { Organization, OrganizationInput } from '@ohp/core';
import { OhpDaoSet } from '../dao';

export class OrganizationControl {
    constructor(private dao: OhpDaoSet) {}

    async create(ctx: ApiContext, input: OrganizationInput): Promise<Organization> {
        const { db, auth } = ctx;
        if (!auth.userId) {
            throw new ForbiddenError('Authentification required');
        }
        return this.dao.organization.create(db, input);
    }

    async byId(ctx: ApiContext, id: Id): Promise<Organization> {
        const { db } = ctx;
        return this.dao.organization.byId(db, id);
    }

    async byName(ctx: ApiContext, name: string): Promise<Organization> {
        const { db } = ctx;
        return this.dao.organization.byName(db, name);
    }
}
