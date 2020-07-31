import { ForbiddenError } from 'apollo-server-koa';
import { Id } from '@engspace/core';
import { OhpContext } from '..';

export async function checkUserOrOrganizationPerm(
    ctx: OhpContext,
    organizationId: Id,
    perm: string
): Promise<boolean> {
    const {
        db,
        auth: { userId, userPerms },
        runtime: { dao },
        config: { rolePolicies },
    } = ctx;
    if (userPerms.includes(perm)) return true;
    const member = await dao.organizationMember.byOrganizationAndUserId(db, organizationId, userId);
    if (!member) {
        return false;
    }
    const perms = rolePolicies.organization.permissions(member.roles);
    return perms.includes(perm);
}

export async function assertUserOrOrganizationPerm(
    ctx: OhpContext,
    organizationId: Id,
    perm: string
): Promise<void> {
    if (!(await checkUserOrOrganizationPerm(ctx, organizationId, perm))) {
        throw new ForbiddenError(`missing org permission: "${perm}"`);
    }
}
