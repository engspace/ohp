import { sql } from 'slonik';
import { User, UserInput } from '@engspace/core';
import { RowId, toId, foreignKey, UserDao, Db } from '@engspace/server-db';

interface Row {
    id: RowId;
    organizationId: RowId;
    name: string;
    email: string;
    fullName: string;
}

function mapRow({ id, organizationId, name, email, fullName }: Row): User {
    return {
        id: toId(id),
        organization: foreignKey(organizationId),
        name,
        email,
        fullName,
    };
}

const rowToken = sql`id, organization_id, name, email, full_name`;

export class OhpUserDao extends UserDao {
    constructor() {
        super({
            mapRow,
            rowToken,
        });
    }

    async create(db: Db, { organizationId, name, email, fullName }: UserInput): Promise<User> {
        const row: Row = await db.one(sql`
            INSERT INTO "user" (
                organization_id,
                name,
                email,
                full_name
            )
            VALUES (
                ${organizationId}, ${name}, ${email}, ${fullName}
            )
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }
}
