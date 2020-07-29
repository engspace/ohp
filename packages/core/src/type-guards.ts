import { IdOr } from '@engspace/core';
import { Organization } from '.';

export function isOrganization(organization: IdOr<Organization>): organization is Organization {
    return (
        typeof organization['name'] !== 'undefined' &&
        typeof organization['description'] !== 'undefined'
    );
}
