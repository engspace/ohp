import Router from '@koa/router';
import Koa from 'koa';
import helmet from 'koa-helmet';
import logger from 'koa-logger';
import { PartRefNaming, ChangeRequestNaming, AuthToken } from '@engspace/core';
import {
    EsKoa,
    EsKoaContext,
    EsKoaMiddleware,
    bodyParserMiddleware,
    corsMiddleware,
    graphQLEndpoint,
    StaticEsNaming,
    EsServerConfig,
    connectDbMiddleware,
    EsServerRuntime,
    extractBearerToken,
    verifyJwt,
    EsKoaState,
    EsKoaCustom,
    EsContext,
} from '@engspace/server-api';
import {
    connectionString,
    createDbPool,
    DbConnConfig,
    DbPool,
    DbPoolConfig,
    ServerConnConfig,
    DbPreparationConfig,
} from '@engspace/server-db';
import { OhpRolePolicies, buildOhpRolePolicies, TokenPayload } from '@ohp/core';
import { buildOhpControlSet, OhpControlSet } from './control';
import { buildOhpDaoSet, OhpDaoSet } from './dao';
import env from './env';
import { buildOhpGqlSchema } from './graphql';
import roleDescriptors from './permissions';

export const ohpDbSchemaLevel = 1;

const serverConnConfig: ServerConnConfig = {
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    pass: env.dbPass,
};

const dbConnConfig: DbConnConfig = {
    ...serverConnConfig,
    name: env.dbName,
};

const dbPoolConfig: DbPoolConfig = {
    dbConnString: connectionString(dbConnConfig),
};

export const dbPreparationConfig: DbPreparationConfig = {
    serverConnString: connectionString(serverConnConfig),
    name: dbConnConfig.name,
    formatDb: env.dbFormat === 'Yes_Im_Sure',
};

export type OhpKoaState = EsKoaState;
export type OhpKoaCustom = EsKoaCustom<OhpDaoSet, OhpControlSet, OhpRolePolicies>;
export type OhpKoa = EsKoa<AuthToken, OhpDaoSet, OhpControlSet, OhpRolePolicies>;
export type OhpKoaContext = EsKoaContext<AuthToken, OhpDaoSet, OhpControlSet, OhpRolePolicies>;
export type OhpKoaMiddleware = EsKoaMiddleware<
    AuthToken,
    OhpDaoSet,
    OhpControlSet,
    OhpRolePolicies
>;
export type OhpContext = EsContext<AuthToken, OhpDaoSet, OhpControlSet, OhpRolePolicies>;
export type OhpServerConfig = EsServerConfig<OhpRolePolicies>;
export type OhpServerRuntime = EsServerRuntime<OhpDaoSet, OhpControlSet>;

const rolePolicies = buildOhpRolePolicies(roleDescriptors);
const pool: DbPool = createDbPool(dbPoolConfig);
const dao = buildOhpDaoSet();
const control = buildOhpControlSet();
export const runtime: OhpServerRuntime = {
    pool,
    dao,
    control,
};
export const config: OhpServerConfig = {
    rolePolicies,
    storePath: env.storePath,
    naming: new StaticEsNaming({
        partRef: new PartRefNaming('${fam_code}${fam_count:5}${part_version:AA}'),
        changeRequest: new ChangeRequestNaming('CR-${counter:5}'),
    }),
};

const userPerms = rolePolicies.user.permissions([]);

const checkBearerTokenMiddleware: OhpKoaMiddleware = async (ctx, next) => {
    const token = extractBearerToken(ctx);
    if (token) {
        try {
            const payload = await verifyJwt<TokenPayload>(token, env.jwtSecret);
            ctx.state.authToken = {
                userId: payload.sub,
                userPerms,
            };
        } catch (err) {
            console.error(err);
            ctx.throw(403);
        }
    } else {
        ctx.state.authToken = {
            userId: '',
            userPerms,
        };
    }
    return next();
};

export function buildOhpServerApp(): OhpKoa {
    const app: OhpKoa = new Koa();
    app.context.runtime = runtime;
    app.context.config = config;

    app.use(helmet());
    app.use(bodyParserMiddleware);
    app.use(corsMiddleware);
    app.use(logger());
    app.use(connectDbMiddleware);
    app.use(checkBearerTokenMiddleware);

    const router = new Router<OhpKoaState, OhpKoaCustom>({ prefix: '/api' });
    router.post('/refresh_token', control.account.refreshSigninEndpoint());
    app.use(router.routes());
    app.use(router.allowedMethods());

    const gql = {
        path: '/api/graphql',
        schema: buildOhpGqlSchema(),
        logging: true,
    };

    app.use(graphQLEndpoint(gql));

    return app;
}
