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
            ],
        },
    },
    organization: {
        self: {
            permissions: ['project.create', 'project.update'],
        },
    },
    project: {
        default: {
            permissions: [],
        },
    },
};

export default descriptors;
