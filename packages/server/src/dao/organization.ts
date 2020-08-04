import { sql } from 'slonik';
import { Id } from '@engspace/core';
import { RowId, toId, DaoBase, Db, foreignKey } from '@engspace/server-db';
import { Organization, OrganizationInput } from '@ohp/core';

const table = 'organization';

interface Row {
    id: RowId;
    name: string;
    description: string;
    selfUserId?: RowId;
}

function mapRow({ id, name, description, selfUserId }: Row): Organization {
    return {
        id: toId(id),
        name,
        description,
        selfUser: foreignKey(selfUserId),
    };
}

const rowToken = sql`
    id, name, description, self_user_id
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

    async create(
        db: Db,
        { name, description, selfUserId }: OrganizationInput
    ): Promise<Organization> {
        const row: Row = await db.one(sql`
            INSERT INTO organization (
                name, description, self_user_id
            )
            VALUES (
                ${name}, ${description}, ${selfUserId || null}
            )
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }

    async byName(db: Db, name: string): Promise<Organization | null> {
        const row: Row = await db.mayBeOne(sql`
            SELECT ${rowToken} FROM organization
            WHERE name = ${name}
        `);
        return row ? mapRow(row) : null;
    }

    async bySelfUserId(db: Db, selfUserId: Id): Promise<Organization> {
        const row: Row = await db.one(sql`
            SELECT ${rowToken} FROM organization
            WHERE self_user_id = ${selfUserId}
        `);
        return mapRow(row);
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
