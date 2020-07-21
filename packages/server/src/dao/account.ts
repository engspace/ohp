import { sql } from 'slonik';
import { Id } from '@engspace/core';
import { RowId, toId, foreignKey, DaoBase, Db, timestamp } from '@engspace/server-db';
import { Account, AccountType, Provider } from '@ohp/core';

const table = 'account';
interface Row {
    id: RowId;
    typeId: string;
    active: number;
    userId: RowId;
    registered: number;
    lastSignin?: number;
}

function mapRow({ id, typeId, active, userId, registered, lastSignin }: Row): Account {
    return {
        id: toId(id),
        active: active !== 0,
        type: typeId as AccountType,
        user: foreignKey(userId),
        registered: timestamp(registered),
        lastSignin: timestamp(lastSignin),
    };
}

const rowToken = sql`
    id, type_id, active, user_id,
    EXTRACT(EPOCH FROM registered) AS registered,
    EXTRACT(EPOCH FROM last_signin) AS last_signin
`;

export interface LocalInput {
    userId: Id;
    password: string;
}

export interface ProviderInput {
    provider: Provider;
    userId: Id;
    providerId: Id;
}

export class AccountDao extends DaoBase<Account, Row> {
    constructor() {
        super(table, {
            mapRow,
            rowToken,
        });
    }

    async createLocal(db: Db, { userId, password }: LocalInput): Promise<Account> {
        const row: Row = await db.one(sql`
            INSERT INTO account (
                type_id,
                active,
                user_id,
                password,
                registered
            )
            VALUES (
                ${AccountType.Local},
                FALSE,
                ${userId},
                CRYPT(${password}, GEN_SALT('bf')),
                NOW()
            )
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }

    async createProvider(
        db: Db,
        { provider, userId, providerId }: ProviderInput
    ): Promise<Account> {
        const row = await db.one(sql`
            INSERT INTO account (
                type_id,
                active,
                user_id,
                provider_id,
                registered,
                last_signin
            )
            VALUES (
                ${provider},
                TRUE,
                ${userId},
                ${providerId},
                NOW(),
                NOW()
            )
            RETURNING ${rowToken}
        `);
        return mapRow(row);
    }

    async byProviderId(db: Db, providerId: string): Promise<Account | null> {
        const row: Row | null = await db.maybeOne(sql`
            SELECT ${rowToken} FROM account WHERE provider_id = ${providerId}
        `);
        return row ? mapRow(row) : null;
    }
}
