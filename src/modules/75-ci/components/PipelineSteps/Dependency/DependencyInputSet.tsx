/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { connect } from 'formik'
import { Text, getMultiTypeFromValue, MultiTypeInputType, FormikForm } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import StepCommonFieldsInputSet from '@ci/components/PipelineSteps/StepCommonFields/StepCommonFieldsInputSet'
import { Connectors } from '@connectors/constants'
import type { DependencyProps } from './Dependency'
import { CIStep } from '../CIStep/CIStep'
import { CIStepOptionalConfig } from '../CIStep/CIStepOptionalConfig'
import { shouldRenderRunTimeInputView } from '../CIStep/StepUtils'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export const DependencyInputSetBasic: React.FC<DependencyProps> = ({
  template,
  path,
  readonly,
  stepViewType,
  allowableTypes,
  formik
}) => {
  const { getString } = useStrings()

  const { expressions } = useVariablesExpression()

  return (
    <FormikForm className={css.removeBpPopoverWrapperTopMargin}>
      <CIStep
        stepLabel={getString('dependencyNameLabel')}
        readonly={readonly}
        stepViewType={stepViewType}
        enableFields={{
          ...(getMultiTypeFromValue(template?.description as string) === MultiTypeInputType.RUNTIME && {
            'spec.description': {}
          }),
          ...(getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME && {
            'spec.connectorRef': {
              label: (
                <Text
                  className={css.inpLabel}
                  color={Color.GREY_600}
                  font={{ size: 'small', weight: 'semi-bold' }}
                  style={{ display: 'flex', alignItems: 'center' }}
                  tooltipProps={{ dataTooltipId: 'dependencyConnectorInfo' }}
                >
                  {getString('pipelineSteps.connectorLabel')}
                </Text>
              ),
              type: [Connectors.GCP, Connectors.AWS, Connectors.DOCKER]
            }
          }),
          ...(getMultiTypeFromValue(template?.spec?.image) === MultiTypeInputType.RUNTIME && {
            'spec.image': {
              tooltipId: 'image',
              multiTextInputProps: {
                placeholder: getString('dependencyImagePlaceholder'),
                disabled: readonly,
                multiTextInputProps: {
                  expressions,
                  allowableTypes,
                  textProps: {
                    autoComplete: 'off'
                  }
                }
              }
            }
          })
        }}
        path={path || ''}
        isInputSetView={true}
        template={template}
      />
      <CIStepOptionalConfig
        stepViewType={stepViewType}
        readonly={readonly}
        enableFields={{
          ...(getMultiTypeFromValue(template?.spec?.privileged) === MultiTypeInputType.RUNTIME && {
            'spec.privileged': {}
          }),
          ...(getMultiTypeFromValue(template?.spec?.envVariables as string) === MultiTypeInputType.RUNTIME && {
            'spec.envVariables': { tooltipId: 'dependencyEnvironmentVariables' }
          }),
          ...(getMultiTypeFromValue(template?.spec?.entrypoint as string) === MultiTypeInputType.RUNTIME && {
            'spec.entrypoint': {}
          }),
          ...(getMultiTypeFromValue(template?.spec?.args as string) === MultiTypeInputType.RUNTIME && {
            'spec.args': {}
          }),
          ...(shouldRenderRunTimeInputView(template?.spec?.portBindings as string) && {
            'spec.portBindings': {}
          })
        }}
        path={path || ''}
        formik={formik}
        isInputSetView={true}
      />
      <StepCommonFieldsInputSet
        path={path}
        readonly={readonly}
        template={template}
        withoutTimeout
        stepViewType={stepViewType}
      />
    </FormikForm>
  )
}

const DependencyInputSet = connect(DependencyInputSetBasic)
export { DependencyInputSet }
