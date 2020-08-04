/* eslint-disable import/order */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import events from 'events';
import fs from 'fs';
import { ApolloServerTestClient, createTestClient } from 'apollo-server-testing';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiHttp from 'chai-http';
import chaiSubset from 'chai-subset';
import 'mocha';
import { AuthToken, HasId } from '@engspace/core';
import { buildTestGqlServer } from '@engspace/server-api';
import { Db, syncSchema, prepareDb, passwordLogin } from '@engspace/server-db';
import { runtime, config, dbPreparationConfig, ohpDbSchemaLevel } from '../src';
import { buildOhpGqlSchema } from '../src/graphql';
import ohpMigrations from '../src/migrations';
import { OhpTestHelpers } from './helpers';

events.EventEmitter.defaultMaxListeners = 100;

chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.use(chaiSubset);

export const pool = runtime.pool;
export const dao = runtime.dao;

export const th = new OhpTestHelpers(pool, dao);

export function permsAuth(user: HasId, userPerms: string[]): AuthToken {
    return {
        userId: user.id,
        userPerms,
    };
}

const schema = buildOhpGqlSchema();

export function buildGqlServer(db: Db, auth: AuthToken): ApolloServerTestClient {
    return createTestClient(buildTestGqlServer({ db, auth, schema, runtime, config }));
}

before('Start-up DB and Server', async function () {
    this.timeout(5000);
    console.log('preparing db with config:');
    console.log(dbPreparationConfig);
    await prepareDb(dbPreparationConfig);
    await runtime.pool.transaction(async (db) => {
        await syncSchema(db, ohpDbSchemaLevel, ohpMigrations);
    });
});

after('Stop DB server', async function () {
    await pool.end();
});

before('Create test store', async function () {
    await fs.promises.mkdir(config.storePath, {
        recursive: true,
    });
});

after('Delete test store', async function () {
    await fs.promises.rmdir(config.storePath, {
        recursive: true,
    });
});
