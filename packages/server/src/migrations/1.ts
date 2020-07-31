import { sql } from 'slonik';
import { esMigrationSet, Db, sqlOperation } from '@engspace/server-db';
import { ohpTreePath } from '../util';

async function addOrgForeignKey(db: Db, table: string): Promise<void> {
    await db.query(sql`
        ALTER TABLE ${sql.identifier([table])}
        ADD COLUMN organization_id integer NOT NULL
    `);
    await db.query(sql`
        ALTER TABLE ${sql.identifier([table])}
        ADD CONSTRAINT ${sql.identifier([`fk_${table}_organization`])}
        FOREIGN KEY(organization_id) REFERENCES organization(id)
    `);
}

async function augmentEngspace(db: Db): Promise<void> {
    // Add organization as foreign key to tables
    const orgTables = ['user', 'project', 'part_family', 'change_request', 'part'];
    for (const table of orgTables) {
        await addOrgForeignKey(db, table);
    }
}

export default {
    level: 1,
    promote: [
        ...esMigrationSet[1].promote,
        sqlOperation.file({
            path: ohpTreePath('sql/1/1-organization.sql'),
            stmtSplit: ';',
        }),
        sqlOperation.func({
            func: augmentEngspace,
        }),
        sqlOperation.file({
            path: ohpTreePath('sql/1/2-account.sql'),
            stmtSplit: ';',
        }),
    ],
    demote: [],
};
