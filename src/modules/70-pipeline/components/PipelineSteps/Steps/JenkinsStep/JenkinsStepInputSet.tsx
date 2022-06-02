/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { connect } from 'formik'
import { useParams } from 'react-router-dom'
import { getMultiTypeFromValue, MultiTypeInputType, FormikForm, Text } from '@wings-software/uicore'
import { Connectors } from '@connectors/constants'
import { Color } from '@harness/design-system'
import type { StringsMap } from 'stringTypes'
import StepCommonFieldsInputSet from '@ci/components/PipelineSteps/StepCommonFields/StepCommonFieldsInputSet'
import type { JenkinsStepProps } from './JenkinsStep'
import { useStrings } from 'framework/strings'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { isEmpty } from 'lodash-es'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'

export const JenkinsStepInputSetBasic: React.FC<JenkinsStepProps> = (formContentProps: any) => {
  const { inputSetData, initialValues, allowableTypes } = formContentProps
  const template = inputSetData?.template
  const path = inputSetData?.path
  const prefix = isEmpty(path) ? '' : `${path}.`
  const readonly = inputSetData?.readonly
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  return (
    <FormikForm className={css.removeBpPopoverWrapperTopMargin}>
      {getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME ? (
        <FormMultiTypeConnectorField
          name={`${prefix}spec.connectorRef`}
          label={getString('pipeline.jiraApprovalStep.connectorRef')}
          selected={(initialValues?.spec?.connectorRef as string) || ''}
          placeholder={getString('connectors.selectConnector')}
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          width={385}
          setRefValue
          // disabled={isApprovalStepFieldDisabled(readonly)}
          multiTypeProps={{
            allowableTypes,
            expressions
          }}
          type={'Jira'}
          gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
        />
      ) : null}
      {/* <CIStep
        readonly={readonly}
        stepViewType={stepViewType}
        enableFields={{
          ...(getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME && {
            'spec.connectorRef': {
              label: { labelKey: 'pipelineSteps.JenkinsConnectorLabel', tooltipId: 'JenkinsConnector' },
              type: Connectors.DOCKER
            }
          })
          // ...(getMultiTypeFromValue(template?.spec?.repo) === MultiTypeInputType.RUNTIME && {
          //   'spec.repo': {}
          // })
        }}
        path={path || ''}
        isInputSetView={true}
        template={template}
      /> */}
      {/* <ArtifactStepCommon
        path={path}
        readonly={readonly}
        template={template}
        allowableTypes={allowableTypes}
        stepViewType={stepViewType}
        formik={formik}
        artifactConnectorType={Connectors.DOCKER}
      />
      <StepCommonFieldsInputSet path={path} readonly={readonly} template={template} stepViewType={stepViewType} /> */}
    </FormikForm>
  )
}

const JenkinsStepInputSet = connect(JenkinsStepInputSetBasic)
export { JenkinsStepInputSet }
