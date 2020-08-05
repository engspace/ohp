import { OhpRoleDescriptors } from '@ohp/core';

const descriptors: OhpRoleDescriptors = {
    user: {
        default: {
            permissions: [
                'user.read',
                'part.read',
                'project.read',
                'partfamily.read',
                'change.read',
                'org.read',
                'orgmember.read',
            ],
        },
        user: {
            permissions: ['org.create'],
        },
    },
    organization: {
        admin: {
            permissions: [
                'project.create',
                'project.update',
                'org.update',
                'orgmember.create',
                'orgmember.update',
                'orgmember.delete',
            ],
        },
        self: {
            inherits: 'admin',
            permissions: [],
        },
    },
    project: {
        default: {
            permissions: [],
        },
    },
};

export default descriptors;
