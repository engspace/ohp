import { ProjectInput, Project } from '@engspace/core';
import { ProjectControl } from '@engspace/server-api';
import { OhpContext } from '..';
import { assertUserOrOrganizationPerm } from './helper';

export class OhpProjectControl extends ProjectControl {
    async create(ctx: OhpContext, project: ProjectInput): Promise<Project> {
        await assertUserOrOrganizationPerm(ctx, project.organizationId, 'project.create');
        const {
            db,
            runtime: { dao },
        } = ctx;
        return dao.project.create(db, project);
    }
}
