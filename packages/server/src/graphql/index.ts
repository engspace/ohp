import { GraphQLSchema } from 'graphql';
import { buildEsSchema, defaultGqlModules } from '@engspace/server-api';
import { OhpControllerSet } from '../control';
import accountGqlModule from './account';

export function buildOhpGqlSchema(control: OhpControllerSet): GraphQLSchema {
    const modules = [...defaultGqlModules, accountGqlModule];
    return buildEsSchema(control, modules);
}
