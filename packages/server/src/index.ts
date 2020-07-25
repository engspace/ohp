import Router from '@koa/router';
import Koa from 'koa';
import helmet from 'koa-helmet';
import logger from 'koa-logger';
import { PartRefNaming, ChangeRequestNaming, buildAppRolePolicies } from '@engspace/core';
import {
    bodyParserMiddleware,
    corsMiddleware,
    graphQLEndpoint,
    StaticEsNaming,
    EsServerConfig,
} from '@engspace/server-api';
import {
    connectionString,
    createDbPool,
    DbConnConfig,
    DbPool,
    DbPoolConfig,
    DbPreparationConfig,
    executeSqlFile,
    syncSchema,
    prepareDb,
    ServerConnConfig,
} from '@engspace/server-db';
import { buildOhpControllerSet, OhpControllerSet } from './control';
import { buildOhpDaoSet, OhpDaoSet } from './dao';
import env from './env';
import { buildOhpGqlSchema } from './graphql';
import ohpMigrations from './migrations';
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

const dbPreparationConfig: DbPreparationConfig = {
    serverConnString: connectionString(serverConnConfig),
    name: dbConnConfig.name,
    formatDb: env.dbFormat === 'Yes_Im_Sure',
};

const dbPoolConfig: DbPoolConfig = {
    dbConnString: connectionString(dbConnConfig),
    slonikOptions: {
        captureStackTrace: true,
    },
};

export interface OhpServerConfig extends EsServerConfig {
    dao: OhpDaoSet;
    control: OhpControllerSet;
}

const rolePolicies = buildAppRolePolicies(roleDescriptors);
const pool: DbPool = createDbPool(dbPoolConfig);
const dao = buildOhpDaoSet();
const control = buildOhpControllerSet(dao, pool, rolePolicies);
const config: OhpServerConfig = {
    rolePolicies,
    storePath: env.storePath,
    pool,
    dao,
    control,
    naming: new StaticEsNaming({
        partRef: new PartRefNaming('${fam_code}${fam_count:5}${part_version:AA}'),
        changeRequest: new ChangeRequestNaming('CR-${counter:5}'),
    }),
};

prepareDb(dbPreparationConfig)
    .then(async () => {
        await pool.transaction((db) => syncSchema(db, ohpDbSchemaLevel, ohpMigrations));
        if (env.devInitScript) {
            if (env.devInitScript.endsWith('.sql')) {
                await pool.transaction((db) => {
                    console.log('executing ' + env.devInitScript);
                    return executeSqlFile(db, {
                        path: env.devInitScript,
                        stmtSplit: ';',
                    });
                });
            } else {
                const { default: initScript } = await import(env.devInitScript);
                await initScript(config);
            }
        }
        const app = buildServerApp();
        app.listen(env.serverPort, () => {
            console.log(`Demo API listening to port ${env.serverPort}`);
        });
    })
    .catch((err) => {
        console.error('error during the demo app');
        console.error(err);
    });

function buildServerApp(): Koa {
    const app = new Koa();

    // app.use(helmet());
    app.use(bodyParserMiddleware);
    app.use(corsMiddleware);
    app.use(logger());
    app.use(control.account.checkBearerTokenMiddleware());

    const router = new Router({ prefix: '/api' });
    router.post('/refresh_token', control.account.refreshSigninEndpoint());
    app.use(router.routes());
    app.use(router.allowedMethods());

    const gql = {
        path: '/api/graphql',
        schema: buildOhpGqlSchema(control),
        logging: true,
    };

    app.use(graphQLEndpoint(gql, config));

    return app;
}
