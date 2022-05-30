/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { Text, Container, Layout } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { Connectors } from '@connectors/constants'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useStrings } from 'framework/strings'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useGitScope, shouldRenderRunTimeInputViewWithAllowedValues } from '@pipeline/utils/CIUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { renderMultiTypeInputWithAllowedValues, getOptionalSubLabel } from './CIStepOptionalConfig'
import { AllMultiTypeInputTypesForStep } from './StepUtils'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface ConnectorRefWithImageProps {
  showOptionalSublabel?: boolean
  readonly?: boolean
  showConnectorRef?: boolean
  showImage?: boolean
  stepViewType: StepViewType
  path?: string
  isInputSetView?: boolean
  template?: Record<string, any>
}

export const ConnectorRefWithImage: React.FC<ConnectorRefWithImageProps> = props => {
  const {
    showOptionalSublabel,
    readonly,
    showConnectorRef = true,
    showImage = true,
    stepViewType,
    path,
    isInputSetView,
    template
  } = props

  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const gitScope = useGitScope()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const stepCss = stepViewType === StepViewType.DeploymentForm ? css.sm : css.lg
  const prefix = isEmpty(path) ? '' : `${path}.`

  return (
    <>
      {showConnectorRef ? (
        <Container className={css.bottomMargin3}>
          {isInputSetView && shouldRenderRunTimeInputViewWithAllowedValues('spec.connectorRef', template) ? (
            <Container className={cx(css.formGroup, stepCss)}>
              {renderMultiTypeInputWithAllowedValues({
                name: `${prefix}spec.connectorRef`,
                labelKey: 'pipelineSteps.connectorLabel',
                fieldPath: 'spec.connectorRef',
                getString,
                readonly,
                expressions,
                template
              })}
            </Container>
          ) : (
            <FormMultiTypeConnectorField
              label={
                <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                  <Text
                    className={css.inpLabel}
                    color={Color.GREY_600}
                    font={{ size: 'small', weight: 'semi-bold' }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {getString('pipelineSteps.connectorLabel')}
                  </Text>
                  &nbsp;
                  {showOptionalSublabel ? getOptionalSubLabel(getString) : null}
                </Layout.Horizontal>
              }
              type={[Connectors.GCP, Connectors.AWS, Connectors.DOCKER]}
              width={385}
              name={`${prefix}spec.connectorRef`}
              placeholder={getString('select')}
              accountIdentifier={accountId}
              projectIdentifier={projectIdentifier}
              orgIdentifier={orgIdentifier}
              multiTypeProps={{
                expressions,
                allowableTypes: AllMultiTypeInputTypesForStep,
                disabled: readonly
              }}
              gitScope={gitScope}
              setRefValue
            />
          )}
        </Container>
      ) : null}
      {showImage ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {isInputSetView && shouldRenderRunTimeInputViewWithAllowedValues('spec.image', template) ? (
            renderMultiTypeInputWithAllowedValues({
              name: `${prefix}spec.image`,
              labelKey: 'imageLabel',
              tooltipId: showOptionalSublabel ? '' : 'image',
              fieldPath: 'spec.image',
              getString,
              readonly,
              expressions,
              template
            })
          ) : (
            <MultiTypeTextField
              name={`${prefix}spec.image`}
              label={
                <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                  <Text
                    className={css.inpLabel}
                    color={Color.GREY_600}
                    font={{ size: 'small', weight: 'semi-bold' }}
                    tooltipProps={
                      showOptionalSublabel
                        ? {}
                        : {
                            dataTooltipId: 'image'
                          }
                    }
                    placeholder={getString('imagePlaceholder')}
                  >
                    {getString('imageLabel')}
                  </Text>
                  &nbsp;
                  {showOptionalSublabel ? getOptionalSubLabel(getString, 'image') : null}
                </Layout.Horizontal>
              }
              multiTextInputProps={{
                disabled: readonly,
                multiTextInputProps: {
                  allowableTypes: AllMultiTypeInputTypesForStep
                }
              }}
            />
          )}
        </Container>
      ) : null}
    </>
  )
}
