import { sql } from 'slonik';
import { Id } from '@engspace/core';
import { RowId, toId, DaoBase, Db } from '@engspace/server-db';
import { Organization, OrganizationInput } from '@ohp/core';

const table = 'organization';

interface Row {
    id: RowId;
    name: string;
    description: string;
}

function mapRow({ id, name, description }: Row): Organization {
    return {
        id: toId(id),
        name,
        description,
    };
}

const rowToken = sql`
    id, name, description
`;

export interface Input {
    name: string;
    description: string;
}

export class OrganizationDao extends DaoBase<Organization, Row> {
    constructor() {
        super(table, {
            rowToken,
            mapRow,
        });
    }

    async create(db: Db, { name, description }: OrganizationInput): Promise<Organization> {
        const row: Row = await db.one(sql`
            INSERT INTO organization (
                name, description
            )
            VALUES (
                ${name}, ${description}
            )
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }

    async byName(db: Db, name: string): Promise<Organization | null> {
        const row: Row = db.mayBeOne(sql`
            SELECT ${rowToken} from organization
            WHERE name = ${name}
        `);
        return row ? mapRow(row) : null;
    }

    async update(db: Db, id: Id, { name, description }: OrganizationInput): Promise<Organization> {
        const row: Row = await db.one(sql`
            UPDATE organization SET
                name = ${name},
                description = ${description}
            WHERE id = ${id}
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }

    async rename(db: Db, { from, to }: { from: string; to: string }): Promise<Organization> {
        const row: Row = await db.one(sql`
            UPDATE organization SET
                name = ${to}
            WHERE name = ${from}
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }
}
