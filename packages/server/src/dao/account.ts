import { sql } from 'slonik';
import { RowId, toId, foreignKey, DaoBase, Db } from '@engspace/server-db';
import { AccountType } from '@ohp/core';
import { VerifiableAccount } from '../control/account';

const table = 'account';

const dependencies = ['user'];

const schema = [
    sql`
        CREATE TABLE account_type (
            id text PRIMARY KEY
        )
    `,
    sql`
        CREATE TABLE account (
            id serial PRIMARY KEY,
            type_id text NOT NULL,
            user_id integer,
            email text NOT NULL,
            verif text NOT NULL,

            FOREIGN KEY(type_id) REFERENCES account_type(id),
            FOREIGN KEY(user_id) REFERENCES "user"(id)
        )
    `,
];

interface Row {
    id: RowId;
    typeId: string;
    userId: RowId;
    email: string;
    verif: string;
}

function mapRow({ id, typeId, userId, email, verif }: Row): VerifiableAccount {
    return {
        id: toId(id),
        type: typeId as AccountType,
        user: foreignKey(userId),
        email,
        verif,
    };
}

const rowToken = sql`
    id, type_id, user_id, email, verif
`;

export interface LocalInput {
    email: string;
    password: string;
}

export class AccountDao extends DaoBase<VerifiableAccount, Row> {
    constructor() {
        super(table, {
            dependencies,
            schema,
            mapRow,
            rowToken,
        });
    }

    async createLocal(db: Db, { email, password }: LocalInput): Promise<VerifiableAccount> {
        const row: Row = await db.one(sql`
            INSERT INTO account (
                type_id,
                email,
                verif
            )
            VALUES (
                ${AccountType.Local},
                ${email},
                CRYPT(${password}, GEN_SALT('bf'))
            )
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }
}
