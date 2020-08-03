<template>
    <v-container>
        <v-row align="center" justify="center">
            <v-col>
                <v-form v-model="formValid">
                    <v-card>
                        <v-card-title>
                            Create project
                            <v-spacer></v-spacer>
                            <v-select
                                v-model="selectedOrg"
                                label="Organization"
                                :items="organizations"
                                class="required"
                            ></v-select>
                            <v-alert v-if="organizationFetchError" type="error">
                                {{ organizationFetchError }}
                            </v-alert>
                        </v-card-title>
                        <v-card-text>
                            <es-project-edit
                                v-model="project"
                            ></es-project-edit>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn
                                color="success"
                                :disabled="!formValid"
                                @click="createProject"
                            >
                                <v-icon>mdi-plus</v-icon> Create
                            </v-btn>
                            <v-alert v-if="error" type="error">
                                {{ error }}
                            </v-alert>
                        </v-card-actions>
                    </v-card>
                </v-form>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { useMutation, useQuery } from '@vue/apollo-composable';
import {
    defineComponent,
    ref,
    watchEffect,
    computed,
    Ref,
} from '@vue/composition-api';
import gql from 'graphql-tag';
import { ProjectInput } from '@engspace/core';
import { Organization } from '@ohp/core';
import { PROJECT_FIELDS, ORGANIZATION_FIELDS } from '@/graphql';
import { useAuth } from '../services/auth';

export default defineComponent({
    setup(props, { root }) {
        const { signedIn, userId } = useAuth();
        watchEffect(() => {
            if (!signedIn.value) {
                root.$router.push('/');
            }
        });

        const formValid = ref(false);

        const {
            result: orgResult,
            error: orgError,
            onResult: onOrgResult,
        } = useQuery(
            gql`
                query GetOrganizationsByUser($userId: ID!) {
                    user(id: $userId) {
                        organization {
                            id
                        }
                        organizations(includeSelf: true) {
                            ...OrganizationFields
                        }
                    }
                }
                ${ORGANIZATION_FIELDS}
            `,
            () => ({
                userId: userId.value,
            })
        );
        const organizations = computed(() => {
            return orgResult.value?.user?.organizations?.map(
                (o: Organization) => ({
                    value: o.id,
                    text: `@${o.name}`,
                })
            );
        });
        const organizationFetchError = computed(() => orgError.value?.message);
        const selectedOrg = ref('');
        onOrgResult((res) => {
            selectedOrg.value = res?.data?.user?.organization?.id;
        });

        const project: Ref<Partial<ProjectInput>> = ref({});
        const {
            mutate: createProject,
            onDone,
            error: createProjError,
        } = useMutation(
            gql`
            mutation CreateProject($input: ProjectInput!) {
                projectCreate(input: $input) {
                    ...ProjectFields
                }
            }
            ${PROJECT_FIELDS},
        `,
            () => ({
                variables: {
                    input: {
                        organizationId: selectedOrg.value,
                        code: project.value.code,
                        name: project.value.name,
                        description: project.value.description,
                    },
                },
            })
        );
        const error = computed(() => createProjError.value?.message);

        onDone((resp) => {
            console.log(resp);
            root.$router.push('/');
        });

        return {
            formValid,
            selectedOrg,
            organizations,
            organizationFetchError,
            project,
            createProject,
            error,
        };
    },
});
</script>
