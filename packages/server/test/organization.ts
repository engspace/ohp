import { expect } from 'chai';
import gql from 'graphql-tag';
import { User, Id } from '@engspace/core';
import { Dict, idType } from '@engspace/server-db';
import { Organization } from '@ohp/core';
import { ORG_FIELDS } from './graphql';
import { dao, pool, th, buildGqlServer, auth } from '.';

describe('GQL Organization', function () {
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

    describe('Query.organization', function () {
        const ORG_READ = gql`
            query ReadOrg($id: ID!) {
                organization(id: $id) {
                    ...OrgFields
                }
            }
            ${ORG_FIELDS}
        `;

        let org: Organization;

        before(function () {
            return pool.transaction(async (db) => {
                org = await th.createOrg(db, {
                    name: 'org',
                    description: 'a description',
                });
            });
        });

        after(function () {
            return pool.transaction(async (db) => dao.organization.deleteById(db, org.id));
        });

        it('should read an organization', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(db, auth(users.a));
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
                },
            });
        });

        it('should read an organization without auth', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(db, auth());
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
                },
            });
        });
    });

    describe('Query.organizationByName and selfUser', function () {
        const ORG_READ_BY_NAME = gql`
            query ReadOrgByName($name: String!) {
                organizationByName(name: $name) {
                    ...OrgFields
                }
            }
            ${ORG_FIELDS}
        `;

        let org: Organization;

        before(function () {
            return pool.transaction(async (db) => {
                org = await th.createOrg(db, {
                    name: 'org',
                    description: 'a description',
                });
            });
        });

        after(function () {
            return pool.transaction(async (db) => dao.organization.deleteById(db, org.id));
        });

        it('should read org by name', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(db, auth(users.a));
                return query({
                    query: ORG_READ_BY_NAME,
                    variables: {
                        name: 'org',
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationByName: {
                    id: org.id,
                    name: 'org',
                    description: 'a description',
                    selfUser: null,
                },
            });
        });

        it('should read org by name without auth', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(db, auth());
                return query({
                    query: ORG_READ_BY_NAME,
                    variables: {
                        name: 'org',
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationByName: {
                    id: org.id,
                    name: 'org',
                    description: 'a description',
                    selfUser: null,
                },
            });
        });

        it('should read selfUser of self org by name', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(db, auth(users.a));
                return query({
                    query: ORG_READ_BY_NAME,
                    variables: {
                        name: 'b',
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationByName: {
                    name: 'b',
                    selfUser: {
                        id: users.b.id,
                        name: 'b',
                    },
                },
            });
        });

        it('should read selfUser of self org by name without auth', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(db, auth());
                return query({
                    query: ORG_READ_BY_NAME,
                    variables: {
                        name: 'b',
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationByName: {
                    name: 'b',
                    selfUser: {
                        id: users.b.id,
                        name: 'b',
                    },
                },
            });
        });
    });

    describe('Mutation.organizationCreate', function () {
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
                const { mutate } = buildGqlServer(db, auth(users.a));
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

        it('should not create an organization without auth', async function () {
            const { errors } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth());
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

    describe('Mutation.organizationUpdate', function () {
        const ORG_UPDATE = gql`
            mutation UpdateOrg($id: ID!, $input: OrganizationInput!) {
                organizationUpdate(id: $id, input: $input) {
                    ...OrgFields
                }
            }
            ${ORG_FIELDS}
        `;

        let org: Organization;

        beforeEach(function () {
            return pool.transaction(async (db) => {
                org = await th.createOrg(db, {
                    name: 'org',
                    description: 'a description',
                    members: [{ user: users.a, roles: ['admin'] }, { user: users.b }],
                });
            });
        });

        afterEach(function () {
            return pool.transaction(async (db) => dao.organization.deleteById(db, org.id));
        });

        it('should update an organization', async function () {
            const { errors, data } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth(users.a));
                return mutate({
                    mutation: ORG_UPDATE,
                    variables: {
                        id: org.id,
                        input: {
                            name: 'updatedorg',
                            description: 'an updated description',
                        },
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationUpdate: {
                    id: org.id,
                    name: 'updatedorg',
                    description: 'an updated description',
                    selfUser: null,
                },
            });
        });

        it('should update not update an organization without admin role', async function () {
            const { errors } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth(users.b));
                return mutate({
                    mutation: ORG_UPDATE,
                    variables: {
                        id: org.id,
                        input: {
                            name: 'updatedorg',
                            description: 'an updated description',
                        },
                    },
                });
            });
            expect(errors).to.be.not.empty;
            expect(errors[0].message).to.contain('org.update');
        });
    });
});
