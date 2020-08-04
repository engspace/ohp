import { expect } from 'chai';
import gql from 'graphql-tag';
import { User, Id } from '@engspace/core';
import { Dict, idType } from '@engspace/server-db';
import { Organization } from '@ohp/core';
import { ORG_FIELDS, USER_FIELDS } from './graphql';
import { dao, pool, th, buildGqlServer, permsAuth } from '.';

describe('Organization', function () {
    let users: Dict<User>;
    before(function () {
        return pool.transaction(async (db) => {
            users = await th.createUsersWithSelfOrg(db, {
                a: { name: 'a' },
                b: { name: 'b' },
                c: { name: 'c' },
                d: { name: 'd' },
            });
        });
    });
    after(th.cleanTables(['organization_member'], { withDeps: true }));

    describe('Organization Read', function () {
        const ORG_READ = gql`
            query ReadOrg($id: ID!) {
                organization(id: $id) {
                    ...OrgFields
                    members {
                        user {
                            ...UserFields
                        }
                        roles
                    }
                }
            }
            ${ORG_FIELDS}
            ${USER_FIELDS}
        `;

        let org: Organization;

        before(function () {
            return pool.transaction(async (db) => {
                org = await th.createOrg(db, {
                    name: 'org',
                    description: 'a description',
                    members: [
                        { user: users.a, roles: ['admin'] },
                        { user: users.b, roles: ['designer'] },
                        { user: users.c },
                    ],
                });
            });
        });

        after(function () {
            return pool.transaction(async (db) => dao.organization.deleteById(db, org.id));
        });

        it('should read an organization', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(
                    db,
                    permsAuth(users.a, ['org.read', 'orgmember.read', 'user.read'])
                );
                return query({
                    query: ORG_READ,
                    variables: {
                        id: org.id,
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organization: {
                    name: 'org',
                    description: 'a description',
                    members: [
                        { user: { id: users.a.id }, roles: ['admin'] },
                        { user: { id: users.b.id }, roles: ['designer'] },
                        { user: { id: users.c.id }, roles: null },
                    ],
                },
            });
        });
    });
    describe('Organization Create', function () {
        const ORG_CREATE = gql`
            mutation CreateOrg($input: OrganizationInput!) {
                organizationCreate(input: $input) {
                    ...OrgFields
                }
            }
            ${ORG_FIELDS}
        `;
        let orgId: Id | null = null;
        afterEach(async function () {
            if (orgId) {
                await pool.transaction(async (db) => dao.organization.deleteById(db, orgId));
                orgId = null;
            }
        });

        it('should create an organization', async function () {
            const { errors, data } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, permsAuth(users.a, ['org.create']));
                return mutate({
                    mutation: ORG_CREATE,
                    variables: {
                        input: {
                            name: 'org',
                            description: 'an organization',
                        },
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationCreate: {
                    name: 'org',
                    description: 'an organization',
                    selfUser: null,
                },
            });
            expect(data.organizationCreate.id).to.be.a(idType);
            orgId = data.organizationCreate.id;
        });

        it('should not create an organization without "org.create"', async function () {
            const { errors } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, permsAuth(users.a, []));
                return mutate({
                    mutation: ORG_CREATE,
                    variables: {
                        input: {
                            name: 'org',
                            description: 'an organization',
                        },
                    },
                });
            });
            expect(errors).to.be.not.empty;
            expect(errors[0].message).to.contain('org.create');
        });
    });
});
