/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { connect } from 'formik'
import { getMultiTypeFromValue, MultiTypeInputType, FormikForm } from '@wings-software/uicore'
import { Connectors } from '@connectors/constants'
import StepCommonFieldsInputSet from '@ci/components/PipelineSteps/StepCommonFields/StepCommonFieldsInputSet'
import type { DockerHubStepProps } from './DockerHubStep'
import { CIStep } from '../CIStep/CIStep'
import { ArtifactStepCommon } from '../CIStep/ArtifactStepCommon'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export const DockerHubStepInputSetBasic: React.FC<DockerHubStepProps> = ({
  template,
  path,
  readonly,
  allowableTypes,
  stepViewType,
  formik
}) => {
  return (
    <FormikForm className={css.removeBpPopoverWrapperTopMargin}>
      <CIStep
        readonly={readonly}
        stepViewType={stepViewType}
        enableFields={{
          ...(getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME && {
            'spec.connectorRef': {
              label: { labelKey: 'pipelineSteps.dockerHubConnectorLabel', tooltipId: 'dockerHubConnector' },
              type: Connectors.DOCKER
            }
          }),
          ...(getMultiTypeFromValue(template?.spec?.repo) === MultiTypeInputType.RUNTIME && {
            'spec.repo': {}
          })
        }}
        path={path || ''}
        isInputSetView={true}
        template={template}
      />
      <ArtifactStepCommon
        path={path}
        readonly={readonly}
        template={template}
        allowableTypes={allowableTypes}
        stepViewType={stepViewType}
        formik={formik}
        artifactConnectorType={Connectors.DOCKER}
      />
      <StepCommonFieldsInputSet path={path} readonly={readonly} template={template} stepViewType={stepViewType} />
    </FormikForm>
  )
}

const DockerHubStepInputSet = connect(DockerHubStepInputSetBasic)
export { DockerHubStepInputSet }
