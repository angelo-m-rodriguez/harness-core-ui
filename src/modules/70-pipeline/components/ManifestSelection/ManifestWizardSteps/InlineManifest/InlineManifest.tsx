/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import {
  Button,
  ButtonVariation,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  StepProps,
  Text
} from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import { Form } from 'formik'

import * as Yup from 'yup'
import { get } from 'lodash-es'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { MonacoTextField } from '@common/components/MonacoTextField/MonacoTextField'
import { ManifestIdentifierValidation, ManifestStoreMap } from '../../Manifesthelper'
import type { InlineDataType, ManifestTypes } from '../../ManifestInterface'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../K8sValuesManifest/ManifestDetails.module.scss'

interface InlinePropType {
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  initialValues: ManifestConfig
  selectedManifest: ManifestTypes | null
  handleSubmit: (data: ManifestConfigWrapper) => void
  manifestIdsList: Array<string>
}

function InlineManifest({
  stepName,
  selectedManifest,
  allowableTypes,
  initialValues,
  handleSubmit,
  prevStepData,
  previousStep,
  manifestIdsList
}: StepProps<ConnectorConfigDTO> & InlinePropType): React.ReactElement {
  const { getString } = useStrings()

  const getInitialValues = useCallback((): InlineDataType => {
    const specValues = get(initialValues, 'spec.store.spec', null)
    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        content: specValues.content
      }
    }
    return {
      identifier: '',
      content: ''
    }
  }, [])

  const submitFormData = (formData: InlineDataType & { store?: string; connectorRef?: string }): void => {
    const manifestObj: ManifestConfigWrapper = {
      manifest: {
        identifier: formData.identifier,
        type: selectedManifest as ManifestTypes,
        spec: {
          store: {
            type: ManifestStoreMap.Inline,
            spec: {
              content: formData.content
            }
          }
        }
      }
    }

    handleSubmit(manifestObj)
  }

  return (
    <Layout.Vertical height={'inherit'} spacing="medium" className={css.optionsViewContainer}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {stepName}
      </Text>

      <Formik
        initialValues={getInitialValues()}
        formName="manifestDetails"
        validationSchema={Yup.object().shape({
          ...ManifestIdentifierValidation(manifestIdsList, initialValues?.identifier, getString('pipeline.uniqueName')),
          content: Yup.string().required(getString('common.contentRequired'))
        })}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData
          })
        }}
      >
        {(formik: { setFieldValue: (a: string, b: string) => void; values: InlineDataType }) => {
          return (
            <Form>
              <Layout.Vertical
                flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                className={css.manifestForm}
              >
                <div className={css.manifestStepWidth}>
                  <div className={css.halfWidth}>
                    <FormInput.Text
                      name="identifier"
                      label={getString('pipeline.manifestType.manifestIdentifier')}
                      placeholder={getString('pipeline.manifestType.manifestPlaceholder')}
                    />
                  </div>
                  <div className={cx(stepCss.formGroup)}>
                    <MultiTypeFieldSelector
                      tooltipProps={{ dataTooltipId: 'inlineContent' }}
                      name="content"
                      label={getString('pipelineSteps.content')}
                      allowedTypes={allowableTypes}
                      expressionRender={() => {
                        /* istanbul ignore next */
                        return (
                          <MonacoTextField
                            name="content"
                            height={100}
                            fullScreenAllowed
                            fullScreenTitle={getString('pipelineSteps.content')}
                          />
                        )
                      }}
                      skipRenderValueInExpressionLabel
                    >
                      <MonacoTextField
                        name="content"
                        height={100}
                        fullScreenAllowed
                        fullScreenTitle={getString('pipelineSteps.content')}
                      />
                    </MultiTypeFieldSelector>
                    {getMultiTypeFromValue(formik.values.content) === MultiTypeInputType.RUNTIME && (
                      <ConfigureOptions
                        style={{ marginTop: 7 }}
                        value={formik.values.content}
                        type="String"
                        variableName="content"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => formik.setFieldValue('content', value)}
                      />
                    )}
                  </div>
                </div>
              </Layout.Vertical>

              <Layout.Horizontal spacing="medium" className={css.saveBtn}>
                <Button
                  variation={ButtonVariation.SECONDARY}
                  text={getString('back')}
                  icon="chevron-left"
                  onClick={/* istanbul ignore next */ () => previousStep?.(prevStepData)}
                />
                <Button
                  variation={ButtonVariation.PRIMARY}
                  type="submit"
                  text={getString('submit')}
                  rightIcon="chevron-right"
                />
              </Layout.Horizontal>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default InlineManifest
