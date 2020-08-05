import { sql } from 'slonik';
import { Id } from '@engspace/core';
import { RowId, toId, foreignKey, DaoBase, Db } from '@engspace/server-db';
import { OrganizationMember, OrganizationMemberInput } from '@ohp/core';

const table = 'organization_member';

interface Row {
    id: RowId;
    organizationId: RowId;
    userId: RowId;
    roles?: string;
}

function mapRow({ id, organizationId, userId, roles }: Row): OrganizationMember {
    return {
        id: toId(id),
        organization: foreignKey(organizationId),
        user: foreignKey(userId),
        roles: roles?.split(';'),
    };
}

const rowToken = sql`id, organization_id, user_id, roles`;

export class OrganizationMemberDao extends DaoBase<OrganizationMember, Row> {
    constructor() {
        super(table, {
            rowToken,
            mapRow,
        });
    }
    /**
     * Add a single member to the database.
     *
     * Roles are also inserted in the Db
     *
     * @param db database connection
     * @param member member to be added
     */
    async create(
        db: Db,
        { organizationId, userId, roles }: OrganizationMemberInput
    ): Promise<OrganizationMember> {
        const row: Row = await db.one(sql`
            INSERT INTO organization_member(
                organization_id, user_id, roles
            ) VALUES (
                ${organizationId}, ${userId}, ${roles?.join(';') || null}
            )
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }

    /**
     * Get all members for an organization id
     */
    async byOrganizationId(db: Db, organizationId: Id): Promise<OrganizationMember[]> {
        const rows = await db.any<Row>(sql`
            SELECT ${this.rowToken} FROM organization_member
            WHERE organization_id = ${organizationId}
        `);
        return rows.map((r) => mapRow(r));
    }

    /**
     * Get all members for a user id.
     * This is used to fetch all organizaions a user is involved in.
     * If includeSelf is false, self user organization is filtered out.
     */
    async byUserId(
        db: Db,
        userId: Id,
        { includeSelf = true }: { includeSelf: boolean }
    ): Promise<OrganizationMember[]> {
        let rows: Row[];
        if (includeSelf) {
            rows = await db.any(sql`
                SELECT ${rowToken} FROM organization_member
                WHERE user_id = ${userId}
            `);
        } else {
            rows = await db.many(sql`
                SELECT ${rowToken} FROM organization_member
                LEFT OUTER JOIN organization AS o ON organization_id = o.id
                WHERE user_id = ${userId} AND o.self_user_id <> user_id
            `);
        }
        return rows.map((r) => mapRow(r));
    }

    /**
     * Get a single organization member by organization and user id.
     * This is used to check if a user is a member of a organization.
     *
     * @param db The databse connection
     * @param organizationId the id of the organization
     * @param userId the id of the user
     *
     * @returns null if no such user, or the organization member
     */
    async byOrganizationAndUserId(
        db: Db,
        organizationId: Id,
        userId: Id
    ): Promise<OrganizationMember | null> {
        const row = await db.maybeOne<Row>(sql`
            SELECT ${this.rowToken} FROM organization_member
            WHERE organization_id=${organizationId} AND user_id=${userId}
        `);
        if (!row) return null;
        return mapRow(row);
    }

    /**
     * Count the number of members with specified role from an organization
     * @param db the database connection
     * @param organizationId the organization
     * @param role the role to look for
     */
    async countByOrganizationIdAndRole(db: Db, organizationId: Id, role: string): Promise<number> {
        return db.oneFirst<number>(sql`
            SELECT COUNT(*) FROM organization_member
            WHERE organization_id=${organizationId} AND roles ILIKE ${'%' + role + '%'}
        `);
    }

    async updateRolesById(db: Db, id: Id, roles: string[]): Promise<OrganizationMember> {
        const row: Row = await db.one(sql`
            UPDATE organization_member SET
                roles = ${roles.join(';')}
            WHERE id = ${id}
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }
}
