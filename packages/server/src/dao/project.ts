import { sql } from 'slonik';
import { Id, Project, ProjectInput } from '@engspace/core';
import { Db, RowId, toId, DaoBaseConfig, foreignKey, ProjectDao } from '@engspace/server-db';

export interface ProjectSearch {
    phrase?: string;
    member?: string;
    limit?: number;
    offset?: number;
}

interface Row {
    id: RowId;
    organizationId: RowId;
    name: string;
    code: string;
    description: string;
}

function mapRow({ id, organizationId, name, code, description }: Row): Project {
    return {
        id: toId(id),
        organization: foreignKey(organizationId),
        name,
        code,
        description,
    };
}

const rowToken = sql`id, organization_id, code, name, description`;

export class OhpProjectDao extends ProjectDao {
    constructor(config: Partial<DaoBaseConfig<Project, Row>> = {}) {
        super({
            rowToken,
            mapRow,
            ...config,
        });
    }

    async create(db: Db, proj: ProjectInput): Promise<Project> {
        const { organizationId, code, name, description } = proj;
        const row: Row = await db.one(sql`
            INSERT INTO project (
                organization_id, code, name, description
            ) VALUES (
                ${organizationId}, ${code}, ${name}, ${description}
            ) RETURNING
                ${this.rowToken}
        `);
        return this.mapRow(row);
    }

    async updateById(db: Db, id: Id, project: ProjectInput): Promise<Project> {
        const { organizationId, code, name, description } = project;
        const row: Row = await db.maybeOne(sql`
            UPDATE project SET
                organization_id=${organizationId},
                code=${code},
                name=${name},
                description=${description}
            WHERE id=${id}
            RETURNING ${this.rowToken}
        `);
        return this.mapRow(row);
    }
}
