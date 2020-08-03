import { prepareDb, syncSchema, executeSqlFile } from '@engspace/server-db';
import env from './env';
import ohpMigrations from './migrations';
import { buildServerApp, dbPreparationConfig, runtime, config, ohpDbSchemaLevel } from '.';

prepareDb(dbPreparationConfig)
    .then(async () => {
        const { pool } = runtime;
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
                await initScript(runtime, config);
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
