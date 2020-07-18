import Router from '@koa/router';
import Koa from 'koa';
import helmet from 'koa-helmet';
import logger from 'koa-logger';
import { buildDefaultAppRolePolicies, PartRefNaming, ChangeRequestNaming } from '@engspace/core';
import {
    buildControllerSet,
    bodyParserMiddleware,
    corsMiddleware,
    checkAuthMiddleware,
    passwordLoginMiddleware,
    checkTokenMiddleware,
    graphQLMiddleware,
    buildEsSchema,
} from '@engspace/server-api';
import {
    buildDaoSet,
    connectionString,
    createDbPool,
    DbConnConfig,
    DbPool,
    DbPoolConfig,
    DbPreparationConfig,
    initSchema,
    prepareDb,
    ServerConnConfig,
} from '@engspace/server-db';

const envConfig = {
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbUser: process.env.DB_USER,
    dbPass: process.env.DB_PASS,
    dbName: process.env.DB_NAME,
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
    formatDb: false,
};

const dbPoolConfig: DbPoolConfig = {
    dbConnString: connectionString(dbConnConfig),
    slonikOptions: {
        captureStackTrace: true,
    },
};

const rolePolicies = buildDefaultAppRolePolicies();
const pool: DbPool = createDbPool(dbPoolConfig);
const dao = buildDaoSet();
const control = buildControllerSet(dao);
const config = {
    rolePolicies,
    storePath: envConfig.storePath,
    pool,
    dao,
    control,
    naming: {
        partRef: new PartRefNaming('${fam_code}${fam_count:5}${part_version:AA}'),
        changeRequest: new ChangeRequestNaming('CR-${counter:5}'),
    },
};

prepareDb(dbPreparationConfig)
    .then(async () => {
        await pool.transaction((db) => initSchema(db, dao));
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

    app.use(helmet());
    app.use(bodyParserMiddleware);
    app.use(corsMiddleware);
    app.use(logger());
    app.use(checkAuthMiddleware);

    const login = passwordLoginMiddleware(config);

    const router = new Router({ prefix: '/api' });
    router.get('/check_token', checkTokenMiddleware);
    router.post('/login', login);
    app.use(router.routes());

    const gql = {
        path: '/api/graphql',
        schema: buildEsSchema(control),
        logging: true,
    };

    app.use(graphQLMiddleware(gql, config));

    return app;
}
