import { Id } from '@engspace/core';

export interface Organization {
    id: Id;
    name: string;
    description: string;
}

declare module '@engspace/core' {
    export interface Project {
        organization: IdOr<Organization>;
    }
    export interface ProjectInput {
        organizationId: Id;
    }
}
