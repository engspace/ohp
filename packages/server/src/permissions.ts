import { AppRoleDescriptors } from '@engspace/core';

const descriptors: AppRoleDescriptors = {
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
    project: {
        default: {
            permissions: [],
        },
    },
};

export default descriptors;
