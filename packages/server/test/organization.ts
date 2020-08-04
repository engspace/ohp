import { expect } from 'chai';
import gql from 'graphql-tag';
import { User } from '@engspace/core';
import { Dict } from '@engspace/server-db';
import { ORG_FIELDS } from './graphql';
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

    describe('Organization Create', function () {
        const ORG_CREATE = gql`
            mutation CreateOrg($input: OrganizationInput!) {
                organizationCreate(input: $input) {
                    ...OrgFields
                }
            }
            ${ORG_FIELDS}
        `;
        let org;
        afterEach(async function () {
            if (org) {
                await pool.transaction(async (db) => {
                    dao.organization.deleteById(db, org.id);
                });
                org = null;
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
