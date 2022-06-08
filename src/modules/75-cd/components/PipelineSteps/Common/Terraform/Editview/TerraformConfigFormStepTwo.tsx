/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  Formik,
  Layout,
  Heading,
  ButtonVariation,
  Text,
  FormInput,
  SelectOption,
  getMultiTypeFromValue,
  Accordion,
  MultiTypeInputType,
  Container,
  Checkbox,
  StepProps
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { Form } from 'formik'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useStrings } from 'framework/strings'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { formInputNames, formikOnChangeNames, stepTwoValidationSchema } from './TerraformConfigFormHelper'

import type { Connector } from '../TerraformInterfaces'

import css from './TerraformConfigForm.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
interface TerraformConfigStepTwoProps {
  allowableTypes: MultiTypeInputType[]
  isReadonly: boolean
  onSubmitCallBack: any
  isTerraformPlan?: boolean
}

export const TerraformConfigStepTwo: React.FC<StepProps<any> & TerraformConfigStepTwoProps> = ({
  previousStep,
  prevStepData,
  onSubmitCallBack,
  isReadonly = false,
  allowableTypes,
  isTerraformPlan = false
}) => {
  const { getString } = useStrings()
  const { TF_MODULE_SOURCE_INHERIT_SSH } = useFeatureFlags()
  const { expressions } = useVariablesExpression()
  const gitFetchTypes: SelectOption[] = [
    { label: getString('gitFetchTypes.fromBranch'), value: getString('pipelineSteps.deploy.inputSet.branch') },
    { label: getString('gitFetchTypes.fromCommit'), value: getString('pipelineSteps.commitIdValue') }
  ]
  const validationSchema = stepTwoValidationSchema(isTerraformPlan, getString)

  return (
    <Layout.Vertical padding="small" className={css.tfConfigForm}>
      <Heading level={2} style={{ color: Color.BLACK, fontSize: 24, fontWeight: 'bold' }} margin={{ bottom: 'xlarge' }}>
        {getString('cd.configFileDetails')}
      </Heading>
      <Formik
        formName="tfRemoteWizardForm"
        initialValues={prevStepData.formValues}
        onSubmit={data => {
          /* istanbul ignore next */
          onSubmitCallBack(data, prevStepData)
        }}
        validationSchema={validationSchema}
      >
        {formik => {
          const connectorValue = (
            isTerraformPlan
              ? formik.values.spec?.configuration?.configFiles?.store?.spec?.connectorRef
              : formik.values.spec?.configuration?.spec?.configFiles?.store?.spec?.connectorRef
          ) as Connector
          const store = isTerraformPlan
            ? formik.values?.spec?.configuration?.configFiles?.store?.spec
            : formik.values?.spec?.configuration?.spec?.configFiles?.store?.spec
          return (
            <Form className={css.formComponent}>
              <div className={css.tfRemoteForm}>
                {(connectorValue?.connector?.spec?.connectionType === 'Account' ||
                  connectorValue?.connector?.spec?.type === 'Account' ||
                  prevStepData?.urlType === 'Account') && (
                  <div className={cx(stepCss.formGroup, stepCss.md)}>
                    <FormInput.MultiTextInput
                      label={getString('pipelineSteps.repoName')}
                      name={formInputNames(isTerraformPlan).repoName}
                      placeholder={getString('pipelineSteps.repoName')}
                      multiTextInputProps={{ expressions, allowableTypes }}
                    />
                    {
                      /* istanbul ignore next */
                      getMultiTypeFromValue(store?.repoName) === MultiTypeInputType.RUNTIME && (
                        <ConfigureOptions
                          style={{ alignSelf: 'center', marginTop: 1 }}
                          value={store?.repoName as string}
                          type="String"
                          variableName={formikOnChangeNames(isTerraformPlan).repoName}
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={value => {
                            formik.setFieldValue(formikOnChangeNames(isTerraformPlan).repoName, value)
                          }}
                          isReadonly={isReadonly}
                        />
                      )
                    }
                  </div>
                )}
                <div className={cx(stepCss.formGroup, stepCss.md)}>
                  <FormInput.Select
                    items={gitFetchTypes}
                    name={formInputNames(isTerraformPlan).gitFetchType}
                    label={getString('pipeline.manifestType.gitFetchTypeLabel')}
                    placeholder={getString('pipeline.manifestType.gitFetchTypeLabel')}
                  />
                </div>
                {store?.gitFetchType === gitFetchTypes[0].value && (
                  <div className={cx(stepCss.formGroup, stepCss.md)}>
                    <FormInput.MultiTextInput
                      label={getString('pipelineSteps.deploy.inputSet.branch')}
                      placeholder={getString('pipeline.manifestType.branchPlaceholder')}
                      name={formInputNames(isTerraformPlan).branch}
                      multiTextInputProps={{ expressions, allowableTypes }}
                    />
                    {
                      /* istanbul ignore next */
                      getMultiTypeFromValue(store?.branch) === MultiTypeInputType.RUNTIME && (
                        <ConfigureOptions
                          style={{ alignSelf: 'center', marginTop: 1 }}
                          value={store?.branch as string}
                          type="String"
                          variableName="configuration.spec.configFiles.store.spec.branch"
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={value => {
                            formik.setFieldValue(formikOnChangeNames(isTerraformPlan).branch, value)
                          }}
                          isReadonly={isReadonly}
                        />
                      )
                    }
                  </div>
                )}

                {store?.gitFetchType === gitFetchTypes[1].value && (
                  <div className={cx(stepCss.formGroup, stepCss.md)}>
                    <FormInput.MultiTextInput
                      label={getString('pipeline.manifestType.commitId')}
                      placeholder={getString('pipeline.manifestType.commitPlaceholder')}
                      name={formInputNames(isTerraformPlan).commitId}
                      multiTextInputProps={{ expressions, allowableTypes }}
                    />
                    {
                      /* istanbul ignore next */
                      getMultiTypeFromValue(store?.commitId) === MultiTypeInputType.RUNTIME && (
                        <ConfigureOptions
                          style={{ alignSelf: 'center', marginTop: 1 }}
                          value={store?.commitId as string}
                          type="String"
                          variableName={formInputNames(isTerraformPlan).commitId}
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={value => {
                            formik.setFieldValue(formikOnChangeNames(isTerraformPlan).commitId, value)
                          }}
                          isReadonly={isReadonly}
                        />
                      )
                    }
                  </div>
                )}

                <div className={cx(stepCss.formGroup, stepCss.md)}>
                  <FormInput.MultiTextInput
                    label={getString('common.git.folderPath')}
                    placeholder={getString('pipeline.manifestType.pathPlaceholder')}
                    name={formInputNames(isTerraformPlan).folderPath}
                    multiTextInputProps={{ expressions, allowableTypes }}
                  />
                  {
                    /* istanbul ignore next */
                    getMultiTypeFromValue(store?.folderPath) === MultiTypeInputType.RUNTIME && (
                      <ConfigureOptions
                        style={{ alignSelf: 'center', marginTop: 1 }}
                        value={store?.folderPath as string}
                        type="String"
                        variableName={formInputNames(isTerraformPlan).folderPath}
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => {
                          formik.setFieldValue(formikOnChangeNames(isTerraformPlan).folderPath, value)
                        }}
                        isReadonly={isReadonly}
                      />
                    )
                  }
                </div>

                {TF_MODULE_SOURCE_INHERIT_SSH && (
                  <Accordion>
                    <Accordion.Panel
                      id="advanced-config"
                      summary={getString('common.advanced')}
                      details={
                        <Container margin={{ top: 'xsmall' }}>
                          <Text
                            tooltipProps={{ dataTooltipId: 'sourceModule' }}
                            font={{ variation: FontVariation.FORM_LABEL }}
                          >
                            Module Source
                          </Text>

                          <>
                            <Checkbox
                              data-testid={`useConnectorCredentials`}
                              name={formInputNames(isTerraformPlan).useConnectorCredentials}
                              label={getString('cd.useConnectorCredentials')}
                              className={css.checkBox}
                              checked={
                                isTerraformPlan
                                  ? formik?.values?.spec?.configuration?.configFiles?.moduleSource
                                      ?.useConnectorCredentials
                                  : formik?.values?.spec?.configuration?.spec?.configFiles?.moduleSource
                                      ?.useConnectorCredentials
                              }
                              onChange={e => {
                                formik.setFieldValue(
                                  formikOnChangeNames(isTerraformPlan).useConnectorCredentials,
                                  e.currentTarget.checked
                                )
                              }}
                            />
                          </>
                        </Container>
                      }
                    />
                  </Accordion>
                )}
              </div>

              <Layout.Horizontal spacing="xxlarge">
                <Button
                  text={getString('back')}
                  variation={ButtonVariation.SECONDARY}
                  icon="chevron-left"
                  onClick={() => {
                    previousStep?.()
                  }}
                  data-testid={'previous-button'}
                  data-name="tf-remote-back-btn"
                />
                <Button
                  type="submit"
                  variation={ButtonVariation.PRIMARY}
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
