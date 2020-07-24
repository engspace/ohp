import { sql } from 'slonik';
import { Id, DateTime } from '@engspace/core';
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

export interface SigninResult {
    refreshToken: string;
    lastSignin: DateTime;
}

export interface RefreshSigninResult {
    refreshToken: string;
    account: Account;
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

    async byUserIdAndPassword(db: Db, { userId, password }: LocalInput): Promise<Account> {
        type R = Row & { ok: boolean };

        const row: R = await db.one(sql`
            SELECT
                ${rowToken},
                (password = CRYPT(${password}, password)) as ok
            FROM account
            WHERE user_id = ${userId}
        `);
        if (!row || !row.ok) {
            return null;
        }
        return mapRow(row);
    }

    async byProviderId(db: Db, providerId: string): Promise<Account | null> {
        const row: Row | null = await db.maybeOne(sql`
            SELECT ${rowToken} FROM account WHERE provider_id = ${providerId}
        `);
        return row ? mapRow(row) : null;
    }

    async signIn(db: Db, id: Id, refreshTokenSize = 32): Promise<SigninResult> {
        interface R {
            refreshToken: string;
            lastSignin: number;
        }
        const { refreshToken, lastSignin }: R = await db.one(sql`
            UPDATE account SET
                refresh_token = GEN_RANDOM_BYTES(${refreshTokenSize}),
                last_signin = NOW()
            WHERE id = ${id}
            RETURNING ENCODE(refresh_token, 'base64') AS refresh_token, last_signin
        `);
        return {
            refreshToken,
            lastSignin: timestamp(lastSignin),
        };
    }

    async refreshSignIn(
        db: Db,
        refreshToken: string,
        refreshTokenSize = 32
    ): Promise<RefreshSigninResult | null> {
        interface R extends Row {
            refreshToken: string;
        }
        const row: R | null = await db.maybeOne(sql`
            UPDATE account SET
                refresh_token = GEN_RANDOM_BYTES(${refreshTokenSize}),
                last_signin = NOW()
            WHERE
                refresh_token = DECODE(${refreshToken}, 'base64')

            RETURNING ENCODE(refresh_token, 'base64') AS refresh_token, ${rowToken}
        `);
        if (!row) return null;
        return {
            refreshToken: row.refreshToken,
            account: mapRow(row),
        };
    }
}
