import Router from '@koa/router';
import Koa from 'koa';
import helmet from 'koa-helmet';
import logger from 'koa-logger';
import {
    buildDefaultAppRolePolicies,
    PartRefNaming,
    ChangeRequestNaming,
    buildAppRolePolicies,
} from '@engspace/core';
import {
    bodyParserMiddleware,
    corsMiddleware,
    checkTokenEndpoint,
    graphQLEndpoint,
    StaticEsNaming,
    checkAuthOrDefaultMiddleware,
} from '@engspace/server-api';
import {
    connectionString,
    createDbPool,
    DbConnConfig,
    DbPool,
    DbPoolConfig,
    DbPreparationConfig,
    syncSchema,
    prepareDb,
    ServerConnConfig,
} from '@engspace/server-db';
import { buildOhpControllerSet } from './control';
import { buildOhpDaoSet } from './dao';
import { buildOhpGqlSchema } from './graphql';
import ohpMigrations from './migrations';
import roleDescriptors from './permissions';

export const ohpDbSchemaLevel = 1;

const envConfig = {
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbUser: process.env.DB_USER,
    dbPass: process.env.DB_PASS,
    dbName: process.env.DB_NAME,
    dbFormat: process.env.DB_FORMAT,
    serverPort: process.env.SERVER_PORT,
    storePath: process.env.STORE_PATH,
};

const serverConnConfig: ServerConnConfig = {
    host: envConfig.dbHost,
    port: envConfig.dbPort,
    user: envConfig.dbUser,
    pass: envConfig.dbPass,
};

const dbConnConfig: DbConnConfig = {
    ...serverConnConfig,
    name: envConfig.dbName,
};

const dbPreparationConfig: DbPreparationConfig = {
    serverConnString: connectionString(serverConnConfig),
    name: dbConnConfig.name,
    formatDb: envConfig.dbFormat === 'format',
};

const dbPoolConfig: DbPoolConfig = {
    dbConnString: connectionString(dbConnConfig),
    slonikOptions: {
        captureStackTrace: true,
    },
};

const rolePolicies = buildAppRolePolicies(roleDescriptors);
const pool: DbPool = createDbPool(dbPoolConfig);
const dao = buildOhpDaoSet();
const control = buildOhpControllerSet(dao);
const config = {
    rolePolicies,
    storePath: envConfig.storePath,
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
        const app = buildServerApp();
        app.listen(envConfig.serverPort, () => {
            console.log(`Demo API listening to port ${envConfig.serverPort}`);
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
    app.use(
        checkAuthOrDefaultMiddleware({
            userId: '',
            userPerms: config.rolePolicies.user.permissions([]),
        })
    );

    const router = new Router({ prefix: '/api' });
    router.get('/check_token', checkTokenEndpoint);
    app.use(router.routes());

    const gql = {
        path: '/api/graphql',
        schema: buildOhpGqlSchema(control),
        logging: true,
    };

    app.use(graphQLEndpoint(gql, config));

    return app;
}
