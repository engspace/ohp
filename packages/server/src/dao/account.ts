import { sql } from 'slonik';
import { Id } from '@engspace/core';
import { RowId, toId, foreignKey, DaoBase, Db } from '@engspace/server-db';
import { AccountType } from '@ohp/core';
import { VerifiableAccount } from '../control/account';

const table = 'account';
interface Row {
    id: RowId;
    typeId: string;
    active: number;
    userId: RowId;
    verif: string;
}

function mapRow({ id, typeId, active, userId, verif }: Row): VerifiableAccount {
    return {
        id: toId(id),
        active: active !== 0,
        type: typeId as AccountType,
        user: foreignKey(userId),
        verif,
    };
}

const rowToken = sql`
    id, type_id, active, user_id, verif
`;

export interface LocalInput {
    userId: Id;
    password: string;
}

export class AccountDao extends DaoBase<VerifiableAccount, Row> {
    constructor() {
        super(table, {
            mapRow,
            rowToken,
        });
    }

    async createLocal(db: Db, { userId, password }: LocalInput): Promise<VerifiableAccount> {
        const row: Row = await db.one(sql`
            INSERT INTO account (
                type_id,
                active,
                user_id,
                verif
            )
            VALUES (
                ${AccountType.Local},
                FALSE,
                ${userId},
                CRYPT(${password}, GEN_SALT('bf'))
            )
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }
}
