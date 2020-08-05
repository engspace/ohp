import { expect } from 'chai';
import gql from 'graphql-tag';
import { User } from '@engspace/core';
import { Dict } from '@engspace/server-db';
import { Organization } from '@ohp/core';
import { ORG_MEMBER_FIELDS } from './graphql';
import { dao, pool, th, buildGqlServer, auth } from '.';

describe('GQL OrganizationMember', function () {
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

    describe('Query.organization.member', function () {
        const ORG_READ_WITH_MEMBERS = gql`
            query ReadOrgWithMembers($id: ID!) {
                organization(id: $id) {
                    members {
                        ...OrgMemberFields
                    }
                }
            }
            ${ORG_MEMBER_FIELDS}
        `;

        it('should read an organization with members', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(db, auth(users.a));
                return query({
                    query: ORG_READ_WITH_MEMBERS,
                    variables: {
                        id: org.id,
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organization: {
                    members: [
                        {
                            id: org.members[0].id,
                            organization: { id: org.id },
                            user: { id: users.a.id },
                            roles: ['admin'],
                        },
                        {
                            id: org.members[1].id,
                            organization: { id: org.id },
                            user: { id: users.b.id },
                            roles: null,
                        },
                    ],
                },
            });
        });

        it('should read an organization with members without auth', async function () {
            const { errors, data } = await pool.connect(async (db) => {
                const { query } = buildGqlServer(db, auth());
                return query({
                    query: ORG_READ_WITH_MEMBERS,
                    variables: {
                        id: org.id,
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organization: {
                    members: [
                        {
                            id: org.members[0].id,
                            organization: { id: org.id },
                            user: { id: users.a.id },
                            roles: ['admin'],
                        },
                        {
                            id: org.members[1].id,
                            organization: { id: org.id },
                            user: { id: users.b.id },
                            roles: null,
                        },
                    ],
                },
            });
        });
    });

    describe('Mutation.organizationMemberAdd', function () {
        const ORG_MEMBER_ADD = gql`
            mutation AddOrgMember($input: OrganizationMemberInput!) {
                organizationMemberAdd(input: $input) {
                    ...OrgMemberFields
                }
            }
            ${ORG_MEMBER_FIELDS}
        `;

        it('should add a member', async function () {
            const { errors, data } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth(users.a));
                return mutate({
                    mutation: ORG_MEMBER_ADD,
                    variables: {
                        input: {
                            organizationId: org.id,
                            userId: users.c.id,
                            roles: ['admin'],
                        },
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationMemberAdd: {
                    organization: {
                        id: org.id,
                    },
                    user: { id: users.c.id },
                    roles: ['admin'],
                },
            });
        });

        it('should not add a member without admin role', async function () {
            const { errors } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth(users.b));
                return mutate({
                    mutation: ORG_MEMBER_ADD,
                    variables: {
                        input: {
                            organizationId: org.id,
                            userId: users.c.id,
                            roles: ['admin'],
                        },
                    },
                });
            });
            expect(errors).to.be.not.be.undefined;
            expect(errors[0].message).to.contain('orgmember.create');
        });

        it('should not add a member without auth', async function () {
            const { errors } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth());
                return mutate({
                    mutation: ORG_MEMBER_ADD,
                    variables: {
                        input: {
                            organizationId: org.id,
                            userId: users.c.id,
                            roles: ['admin'],
                        },
                    },
                });
            });
            expect(errors).to.be.not.be.undefined;
            expect(errors[0].message).to.contain('orgmember.create');
        });
    });
    describe('Mutation.organizationMemberRemove', function () {
        const ORG_MEMBER_REM = gql`
            mutation RemOrgMember($memberId: ID!) {
                organizationMemberRemove(memberId: $memberId) {
                    ...OrgMemberFields
                }
            }
            ${ORG_MEMBER_FIELDS}
        `;

        it('should remove a member', async function () {
            const { errors, data } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth(users.a));
                return mutate({
                    mutation: ORG_MEMBER_REM,
                    variables: {
                        memberId: org.members[1].id,
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationMemberRemove: {
                    organization: {
                        id: org.id,
                    },
                    user: { id: users.b.id },
                    roles: null,
                },
            });
        });

        it('should not remove a member without "admin"', async function () {
            const { errors } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth(users.b));
                return mutate({
                    mutation: ORG_MEMBER_REM,
                    variables: {
                        memberId: org.members[0].id,
                    },
                });
            });
            expect(errors).to.be.not.undefined;
            expect(errors[0].message).to.contain('orgmember.delete');
        });

        it('should self remove a member without "admin"', async function () {
            const { errors, data } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth(users.b));
                return mutate({
                    mutation: ORG_MEMBER_REM,
                    variables: {
                        memberId: org.members[1].id,
                    },
                });
            });
            expect(errors).to.be.undefined;
            expect(data).to.containSubset({
                organizationMemberRemove: {
                    organization: {
                        id: org.id,
                    },
                    user: { id: users.b.id },
                    roles: null,
                },
            });
        });

        it('should not remove the last "admin" member', async function () {
            const { errors } = await pool.transaction(async (db) => {
                const { mutate } = buildGqlServer(db, auth(users.a));
                return mutate({
                    mutation: ORG_MEMBER_REM,
                    variables: {
                        memberId: org.members[0].id,
                    },
                });
            });
            expect(errors).to.be.not.undefined;
            expect(errors[0].message.toLowerCase()).to.contain('admin');
        });
    });
});
