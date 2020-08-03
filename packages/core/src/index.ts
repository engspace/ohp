import {
    Id,
    IdOr,
    User,
    DateTime,
    EsRolePolicies,
    RolePolicy,
    EsRoleDescriptors,
    RoleDescriptorSet,
    buildRolePolicy,
} from '@engspace/core';

export { isOrganization } from './type-guards';

export interface OhpRoleDescriptors extends EsRoleDescriptors {
    organization: RoleDescriptorSet;
}

export interface OhpRolePolicies extends EsRolePolicies {
    organization: RolePolicy;
}

export function buildOhpRolePolicies(descriptors: OhpRoleDescriptors): OhpRolePolicies {
    return {
        user: buildRolePolicy(descriptors.user),
        organization: buildRolePolicy(descriptors.organization),
        project: buildRolePolicy(descriptors.project),
    };
}

export enum AccountType {
    Local = 'LOCAL',
    Google = 'GOOGLE',
}

export type Provider = AccountType.Google;

export interface Account {
    id: Id;
    type: AccountType;
    active: boolean;
    user: IdOr<User>;
    registered: DateTime;
    lastSignin?: DateTime;
}

export interface SigninResult {
    bearerToken: string;
    refreshToken: string;
    account: Account;
}

/** Payload of an access token */
export interface TokenPayload {
    /** Issuer: openhardware-platform.com */
    iss: string;
    /** Subject: the id of the user in the database */
    sub: string;
    /** Expiration date (seconds since epoch) */
    exp: number;
    /** Name (pseudo) of the user */
    name: string;
    /** Url to the user picture */
    picture: string;
}

export interface Organization {
    id: Id;
    name: string;
    description: string;
    selfUser: IdOr<User>;
}

export interface OrganizationInput {
    name: string;
    description: string;
    selfUserId: Id | null;
}

export interface OrganizationMember {
    id: Id;
    organization: IdOr<Organization>;
    user: IdOr<User>;
    roles: string[];
}

export interface OrganizationMemberInput {
    organizationId: Id;
    userId: Id;
    roles: string[];
}

declare module '@engspace/core' {
    export interface Project {
        organization: IdOr<Organization>;
    }
    export interface ProjectInput {
        organizationId: Id;
    }
    export interface PartFamily {
        organization: IdOr<Organization>;
    }
    export interface ChangeRequest {
        organization: IdOr<Organization>;
    }
    export interface Part {
        organization: IdOr<Organization>;
    }
}
