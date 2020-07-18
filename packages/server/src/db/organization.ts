import { sql } from 'slonik';
import { RowId, toId, DaoBaseConfig, DaoBase } from '@engspace/server-db';
import { Organization } from '@ohp/core';

const table = 'organization';

const dependencies = [];

const schema = [
    sql`
        CREATE TABLE organization (
            id serial PRIMARY KEY,
            name text NOT NULL,
            description text NOT NULL
        )
    `,
];

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
    constructor(config: Partial<DaoBaseConfig<Organization, Row>> = {}) {
        super(table, {
            dependencies,
            schema,
            rowToken,
            mapRow,
            ...config,
        });
    }
}
