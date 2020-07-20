import { esMigrationSet } from '@engspace/server-db';
import { sqlOperation } from '@engspace/server-db/dist/migration';
import { ohpTreePath } from '../util';

export default {
    level: 1,
    promote: [
        ...esMigrationSet[1].promote,
        sqlOperation.file({
            path: ohpTreePath('sql/1/1-schema.sql'),
            stmtSplit: ';',
        }),
        sqlOperation.file({
            path: ohpTreePath('sql/1/2-populate.sql'),
            stmtSplit: ';',
        }),
    ],
    demote: [],
};
