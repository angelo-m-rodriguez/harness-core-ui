/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, set, get } from 'lodash-es'
import produce from 'immer'
import { useHistory, useParams } from 'react-router-dom'
import * as Yup from 'yup'
import type { FormikProps } from 'formik'
import { Button, Dialog, Formik, FormikForm, FormInput, Layout, SelectOption } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { NameIdDescriptionTags } from '@common/components'
import type { ClonePipelineProperties, PMSPipelineSummaryResponse } from 'services/pipeline-ng'
import { useClonePipeline } from 'services/pipeline-ng'
import {
  OrganizationResponse,
  ProjectAggregateDTO,
  useGetOrganizationList,
  useGetProjectAggregateDTOList
} from 'services/cd-ng'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ErrorHandler } from '@common/components/ErrorHandler/ErrorHandler'
import { NameSchema, IdentifierSchema } from '@common/utils/Validation'
import routes from '@common/RouteDefinitions'

import css from './ClonePipelineForm.module.scss'

export interface ClonePipelineFormProps {
  isOpen: boolean
  onClose(e?: React.SyntheticEvent): void
  originalPipeline: Pick<PMSPipelineSummaryResponse, 'name' | 'identifier' | 'description' | 'tags'>
}

export interface FormState extends Required<ClonePipelineProperties> {
  name?: string
  identifier?: string
  description?: string
  tags?: Record<string, string>
}

export function ClonePipelineForm(props: ClonePipelineFormProps): React.ReactElement {
  const { isOpen, onClose } = props
  const { getString } = useStrings()

  return (
    <Dialog
      isOpen={isOpen}
      title={getString('pipeline.clone')}
      className={css.cloneForm}
      enforceFocus={false}
      onClose={onClose}
      canOutsideClickClose={false}
      lazy
    >
      <ClonePipelineFormInternal {...props} />
    </Dialog>
  )
}

export function ClonePipelineFormInternal(props: ClonePipelineFormProps): React.ReactElement {
  const { isOpen, onClose, originalPipeline } = props
  const { getString } = useStrings()
  const formikRef = React.useRef<FormikProps<FormState>>()
  const history = useHistory()
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()
  const { mutate: clonePipeline, error: cloneError } = useClonePipeline({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { data: orgData, loading: orgDataLoading } = useGetOrganizationList({
    queryParams: {
      accountIdentifier: accountId,
      pageSize: 200
    },
    lazy: !isOpen
  })
  const {
    data: projectData,
    loading: projectDataLoading,
    refetch: refetchProjectsData
  } = useGetProjectAggregateDTOList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier
    },
    lazy: !isOpen
  })

  const organizations: SelectOption[] = React.useMemo(() => {
    const data: OrganizationResponse[] = get(orgData, 'data.content', [])
    return data.map(org => {
      return {
        label: org.organization.name,
        value: org.organization.identifier
      }
    })
  }, [orgData])

  const projects: SelectOption[] = React.useMemo(() => {
    const data: ProjectAggregateDTO[] = get(projectData, 'data.content', [])
    return data.map(project => {
      return {
        label: project.projectResponse.project.name,
        value: project.projectResponse.project.identifier
      }
    })
  }, [projectData])

  function handleOrgChange(item: SelectOption): void {
    refetchProjectsData({
      queryParams: {
        accountIdentifier: accountId,
        orgIdentifier: item.value as string
      }
    })

    /* istanbul ignore else */
    if (formikRef.current) {
      const newValues = produce(formikRef.current.values, draft => {
        set(draft, 'destinationConfig.orgIdentifier', item.value)
        set(draft, 'destinationConfig.projectIdentifier', '')
      })
      formikRef.current.setValues(newValues)
    }
  }

  async function handleSubmit(formData: FormState): Promise<FormState> {
    const data: Required<ClonePipelineProperties> = {
      sourceConfig: { ...formData.sourceConfig },
      destinationConfig: {
        ...formData.destinationConfig,
        pipelineIdentifier: formData.identifier,
        pipelineName: formData.name,
        description: formData.description,
        tags: formData.tags
      },
      cloneConfig: { ...formData.cloneConfig }
    }

    await clonePipeline(data)

    history.push(
      routes.toPipelineDetail({
        module,
        pipelineIdentifier: defaultTo(data.destinationConfig.pipelineIdentifier, ''),
        orgIdentifier: defaultTo(data.destinationConfig.orgIdentifier, ''),
        projectIdentifier: defaultTo(data.destinationConfig.projectIdentifier, ''),
        accountId
      })
    )

    onClose()

    return formData
  }

  const loading = orgDataLoading || projectDataLoading
  const initialvalues: FormState = React.useMemo(
    () => ({
      name: `${originalPipeline.name} - Clone`,
      identifier: `${originalPipeline.identifier}_Clone`,
      tags: originalPipeline.tags,
      description: originalPipeline.description,
      sourceConfig: {
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier: originalPipeline.identifier
      },
      destinationConfig: {
        orgIdentifier,
        projectIdentifier
      },
      cloneConfig: {
        connectors: false,
        inputSets: false,
        templates: false,
        triggers: false
      }
    }),
    [originalPipeline, orgIdentifier, projectIdentifier]
  )

  const responseMessages = get(cloneError, 'data.responseMessages')

  return (
    <div data-testid="clone-pipeline-form" onClick={e => e.stopPropagation()}>
      <Formik<FormState>
        formName="clone-pipeline"
        initialValues={initialvalues}
        onSubmit={handleSubmit}
        formLoading={loading}
        validationSchema={Yup.object().shape({
          name: NameSchema(),
          identifier: IdentifierSchema(),
          destinationConfig: Yup.object().shape({
            orgIdentifier: Yup.string().trim().required(getString('validation.orgValidation')),
            projectIdentifier: Yup.string().trim().required(getString('common.validation.projectIsRequired'))
          })
        })}
      >
        {formikProps => {
          formikRef.current = formikProps

          return (
            <FormikForm className={css.form}>
              <div className={css.section}>
                <div>
                  <NameIdDescriptionTags formikProps={formikProps} />
                  <FormInput.Select
                    selectProps={{ usePortal: true }}
                    label={getString('orgLabel')}
                    name="destinationConfig.orgIdentifier"
                    items={organizations}
                    onChange={handleOrgChange}
                  />
                  <FormInput.Select
                    key={get(formikProps.values, 'destinationConfig.orgIdentifier')}
                    selectProps={{ usePortal: true }}
                    label={getString('projectLabel')}
                    name="destinationConfig.projectIdentifier"
                    items={projects}
                  />
                </div>
                {Array.isArray(responseMessages) ? (
                  <ErrorHandler responseMessages={responseMessages} className={css.error} />
                ) : null}
              </div>
              <Layout.Horizontal padding={{ top: 'large' }} spacing="medium">
                <RbacButton
                  permission={{
                    resource: { resourceType: ResourceType.PIPELINE },
                    permission: PermissionIdentifier.EDIT_PIPELINE
                  }}
                  intent="primary"
                  text={getString('projectCard.clone')}
                  type="submit"
                  data-testid="clone"
                />
                <Button intent="none" text={getString('cancel')} type="reset" onClick={onClose} />
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </div>
  )
}
