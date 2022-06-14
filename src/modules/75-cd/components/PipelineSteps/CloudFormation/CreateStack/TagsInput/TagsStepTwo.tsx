/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import cx from 'classnames'
import { isEmpty } from 'lodash-es'
import { Form } from 'formik'
import {
  Button,
  ButtonVariation,
  Layout,
  Text,
  Color,
  StepProps,
  Formik,
  MultiTypeInputType,
  getMultiTypeFromValue,
  FormInput,
  SelectOption
} from '@harness/uicore'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useStrings } from 'framework/strings'
import { FormatRemoteTagsData } from '../../CloudFormationHelper'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../../CloudFormation.module.scss'

const Account = 'Account'
interface StepTwoProps {
  allowableTypes: MultiTypeInputType[]
  onSubmit: (values: any, prevStepData: any) => void
  initialValues: any
}

const TagsStepTwo: React.FC<StepProps<any> & StepTwoProps> = ({
  previousStep,
  prevStepData,
  allowableTypes,
  onSubmit,
  initialValues
}) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const pathSchema = Yup.lazy((value): Yup.Schema<unknown> => {
    /* istanbul ignore next */
    if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
      return Yup.array().of(Yup.string().min(1).required(getString('cd.pathCannotBeEmpty')))
    }
    /* istanbul ignore next */
    return Yup.string().required(getString('cd.pathCannotBeEmpty'))
  })
  const tagsSchema = Yup.object().shape({
    spec: Yup.object().shape({
      store: Yup.object().shape({
        spec: Yup.object().when('type', {
          is: value => value !== 'S3',
          then: Yup.object().shape({
            gitFetchType: Yup.string().required(getString('cd.gitFetchTypeRequired')),
            branch: Yup.string().when('gitFetchType', {
              is: 'Branch',
              then: Yup.string().trim().required(getString('validation.branchName'))
            }),
            commitId: Yup.string().when('gitFetchType', {
              is: 'Commit',
              then: Yup.string().trim().required(getString('validation.commitId'))
            }),
            paths: pathSchema
          }),
          otherwise: Yup.object().shape({
            paths: pathSchema
          })
        })
      })
    })
  })
  const gitFetchTypes: SelectOption[] = [
    { label: getString('gitFetchTypes.fromBranch'), value: getString('pipelineSteps.deploy.inputSet.branch') },
    { label: getString('gitFetchTypes.fromCommit'), value: getString('pipelineSteps.commitIdValue') }
  ]

  return (
    <Layout.Vertical spacing="xxlarge" padding="small" className={css.filePath}>
      <Text font="large" color={Color.GREY_800}>
        {getString('cd.cloudFormation.remoteTagsFileStore')}
      </Text>
      <Formik
        formName="RemoteStepTwo"
        initialValues={FormatRemoteTagsData(initialValues, prevStepData)}
        enableReinitialize
        validationSchema={tagsSchema}
        onSubmit={data => onSubmit(data, prevStepData)}
      >
        {({ values }) => {
          const name = 'spec.store.spec.paths[0]'
          /* istanbul ignore next */ // jest doesnt count options as branch coverage
          const isNotS3 = values?.spec?.store?.type !== 'S3'
          /* istanbul ignore next */
          const connectorRef = values?.spec?.store?.spec?.connectorRef
          /* istanbul ignore next */
          const repoName = values?.spec?.store?.spec?.repoName
          /* istanbul ignore next */
          let filePaths = values?.spec?.store?.spec?.paths
          /* istanbul ignore next */
          if (isEmpty(filePaths)) {
            filePaths = ['']
          }
          return (
            <Form>
              <div className={css.filePathForm}>
                {isNotS3 && (
                  <>
                    {
                      /* istanbul ignore next */
                      (connectorRef?.connector?.spec?.connectionType === Account ||
                        connectorRef?.connector?.spec?.type === Account ||
                        prevStepData?.urlType === Account) && (
                        <div className={cx(stepCss.formGroup, stepCss.md)}>
                          <FormInput.MultiTextInput
                            label={getString('pipelineSteps.repoName')}
                            name="spec.store.spec.repoName"
                            placeholder={getString('pipelineSteps.repoName')}
                            multiTextInputProps={{ expressions, allowableTypes }}
                          />

                          {
                            /* istanbul ignore next */
                            getMultiTypeFromValue(repoName) === MultiTypeInputType.RUNTIME && (
                              <ConfigureOptions
                                style={{ alignSelf: 'center', marginTop: 1 }}
                                value={repoName}
                                type="String"
                                variableName="spec.store.spec.repoName"
                                showRequiredField={false}
                                showDefaultField={false}
                                showAdvanced={true}
                              />
                            )
                          }
                        </div>
                      )
                    }
                    <div className={cx(stepCss.formGroup, stepCss.md)}>
                      <FormInput.Select
                        items={gitFetchTypes}
                        name="spec.store.spec.gitFetchType"
                        label={getString('pipeline.manifestType.gitFetchTypeLabel')}
                        placeholder={getString('pipeline.manifestType.gitFetchTypeLabel')}
                      />
                    </div>

                    {
                      /* istanbul ignore next */
                      values?.spec?.store?.spec?.gitFetchType === gitFetchTypes[0].value && (
                        <div className={cx(stepCss.formGroup, stepCss.md)}>
                          <FormInput.MultiTextInput
                            label={getString('pipelineSteps.deploy.inputSet.branch')}
                            placeholder={getString('pipeline.manifestType.branchPlaceholder')}
                            name="spec.store.spec.branch"
                            multiTextInputProps={{ expressions, allowableTypes }}
                          />

                          {
                            /* istanbul ignore next */
                            getMultiTypeFromValue(values?.spec?.store?.spec?.branch) === MultiTypeInputType.RUNTIME && (
                              <ConfigureOptions
                                style={{ alignSelf: 'center', marginTop: 1 }}
                                value={values?.spec?.store?.spec?.branch as string}
                                type="String"
                                variableName="spec.store.spec.branch"
                                showRequiredField={false}
                                showDefaultField={false}
                                showAdvanced={true}
                              />
                            )
                          }
                        </div>
                      )
                    }

                    {
                      /* istanbul ignore next */
                      values?.spec?.store?.spec?.gitFetchType === gitFetchTypes[1].value && (
                        <div className={cx(stepCss.formGroup, stepCss.md)}>
                          <FormInput.MultiTextInput
                            label={getString('pipeline.manifestType.commitId')}
                            placeholder={getString('pipeline.manifestType.commitPlaceholder')}
                            name="spec.store.spec.commitId"
                            multiTextInputProps={{ expressions, allowableTypes }}
                          />

                          {
                            /* istanbul ignore next */
                            getMultiTypeFromValue(values?.spec?.store?.spec?.commitId) ===
                              MultiTypeInputType.RUNTIME && (
                              <ConfigureOptions
                                style={{ alignSelf: 'center', marginTop: 1 }}
                                value={values?.spec?.store?.spec?.commitId as string}
                                type="String"
                                variableName="spec.store.spec.commitId"
                                showRequiredField={false}
                                showDefaultField={false}
                                showAdvanced={true}
                              />
                            )
                          }
                        </div>
                      )
                    }
                  </>
                )}
                <div className={cx(stepCss.md)}>
                  <MultiTypeFieldSelector
                    name={name}
                    style={{ width: 370 }}
                    allowedTypes={allowableTypes.filter(item => item !== MultiTypeInputType.EXPRESSION)}
                    label={
                      <Text flex={{ inline: true }}>
                        {getString(
                          isNotS3 ? 'cd.cloudFormation.remoteTagsFilePath' : 'cd.cloudFormation.remoteTagsUrlPath'
                        )}
                      </Text>
                    }
                  >
                    <FormInput.MultiTextInput
                      name={name}
                      label=""
                      multiTextInputProps={{
                        expressions,
                        allowableTypes: allowableTypes.filter(item => item !== MultiTypeInputType.RUNTIME)
                      }}
                    />
                  </MultiTypeFieldSelector>
                </div>
              </div>

              <Layout.Horizontal spacing="xxlarge">
                <Button
                  text={getString('back')}
                  variation={ButtonVariation.SECONDARY}
                  icon="chevron-left"
                  onClick={() => {
                    /* istanbul ignore next */
                    previousStep?.()
                  }}
                  data-testid="back"
                />
                <Button
                  type="submit"
                  variation={ButtonVariation.PRIMARY}
                  text={getString('submit')}
                  rightIcon="chevron-right"
                  data-testid="submit"
                />
              </Layout.Horizontal>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default TagsStepTwo
