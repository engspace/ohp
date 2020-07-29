import { GraphQLSchema } from 'graphql';
import { buildEsSchema, defaultGqlModules } from '@engspace/server-api';
import { OhpControllerSet } from '../control';
import accountGqlModule from './account';
import organizationGqlModule from './organization';
import projectGqlModule from './project';
import userGqlModule from './user';

export function buildOhpGqlSchema(control: OhpControllerSet): GraphQLSchema {
    const modules = [
        ...defaultGqlModules,
        accountGqlModule,
        organizationGqlModule,
        projectGqlModule,
        userGqlModule,
    ];
    return buildEsSchema(control, modules);
}
