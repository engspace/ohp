import { GraphQLSchema } from 'graphql';
import { AuthToken } from '@engspace/core';
import { buildEsSchema, defaultGqlModules, GqlContext } from '@engspace/server-api';
import { OhpRolePolicies } from '@ohp/core';
import { OhpControllerSet } from '../control';
import { OhpDaoSet } from '../dao';
import accountGqlModule from './account';
import organizationGqlModule from './organization';
import projectGqlModule from './project';
import userGqlModule from './user';

export type OhpGqlContext = GqlContext<AuthToken, OhpDaoSet, OhpControllerSet, OhpRolePolicies>;

export function buildOhpGqlSchema(): GraphQLSchema {
    const modules = [
        ...defaultGqlModules,
        accountGqlModule,
        organizationGqlModule,
        projectGqlModule,
        userGqlModule,
    ];
    return buildEsSchema(modules);
}
