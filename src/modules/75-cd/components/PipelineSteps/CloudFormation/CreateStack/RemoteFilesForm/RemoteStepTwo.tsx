/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import cx from 'classnames'
import { map, isNumber, isEmpty } from 'lodash-es'
import { FieldArray, Form } from 'formik'
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
  Icon
} from '@harness/uicore'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useStrings } from 'framework/strings'
import { FormatFilePaths, AllowedTypes, StepTwoTitle, RemoteFileStorePath } from '../../CloudFormationHelper'
import { onDragStart, onDragEnd, onDragLeave, onDragOver, onDrop } from '../../DragHelper'
import { ParameterRepoDetails } from './ParameterRepoDetails'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../../CloudFormation.module.scss'

interface StepTwoProps {
  allowableTypes: MultiTypeInputType[]
  initialValues: any
  onSubmit: (values: any, prevStepData: any) => void
  index?: number
}

const S3 = AllowedTypes[4]

const StepTwo: React.FC<StepProps<any> & StepTwoProps> = ({
  previousStep,
  prevStepData,
  allowableTypes,
  initialValues,
  onSubmit,
  index
}) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const title = getString(StepTwoTitle(isNumber(index)))
  const templateTitle = getString(RemoteFileStorePath(isNumber(index), prevStepData?.selectedConnector === S3))
  const pathSchema = Yup.lazy((value): Yup.Schema<unknown> => {
    if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
      return Yup.array().of(Yup.string().min(1).required(getString('cd.pathCannotBeEmpty')))
    }
    return Yup.string().required(getString('cd.pathCannotBeEmpty'))
  })
  const templateSchema = Yup.object().shape({
    spec: Yup.object().shape({
      configuration: Yup.object().shape({
        templateFile: Yup.object().shape({
          spec: Yup.object().shape({
            store: Yup.object().shape({
              spec: Yup.object().shape({
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
              })
            })
          })
        })
      })
    })
  })
  const paramSchema = Yup.object().shape({
    spec: Yup.object().shape({
      configuration: Yup.object().shape({
        parameters: Yup.object().shape({
          identifier: Yup.string().required(getString('cd.pathCannotBeEmpty')),
          store: Yup.object().shape({
            type: Yup.string(),
            spec: Yup.object().when('type', {
              is: value => value !== 'S3Url',
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
    })
  })
  return (
    <Layout.Vertical spacing="xxlarge" padding="small" className={css.filePath}>
      <Text font="large" color={Color.GREY_800}>
        {title}
      </Text>
      <Formik
        formName="RemoteStepTwo"
        initialValues={FormatFilePaths(initialValues, prevStepData, index)}
        enableReinitialize
        validationSchema={isNumber(index) ? paramSchema : templateSchema}
        onSubmit={data => onSubmit(data, prevStepData)}
      >
        {({ values }) => {
          let name = 'spec.configuration.templateFile.spec.store.spec.paths[0]'
          let filePaths = values?.spec?.configuration?.templateFile?.spec?.store?.spec?.paths
          const connector = prevStepData?.selectedConnector
          if (isNumber(index)) {
            name = `spec.configuration.parameters.store.spec.paths`
            filePaths = values?.spec?.configuration?.parameters?.store?.spec?.paths
          }
          if (isEmpty(filePaths)) {
            filePaths = ['']
          }
          return (
            <Form>
              <div className={css.filePathForm}>
                {isNumber(index) && (
                  <div className={cx(stepCss.formGroup, stepCss.md)}>
                    <FormInput.Text name="spec.configuration.parameters.identifier" label={getString('identifier')} />
                  </div>
                )}
                {connector !== S3 && (
                  <ParameterRepoDetails
                    allowableTypes={allowableTypes}
                    index={index}
                    values={values}
                    prevStepData={prevStepData}
                  />
                )}
                <div className={cx(stepCss.md)}>
                  <MultiTypeFieldSelector
                    name={name}
                    style={{ width: 370 }}
                    allowedTypes={allowableTypes.filter(item => item !== MultiTypeInputType.EXPRESSION)}
                    label={<Text flex={{ inline: true }}>{templateTitle}</Text>}
                  >
                    {!isNumber(index) ? (
                      <FormInput.MultiTextInput
                        name={name}
                        label=""
                        multiTextInputProps={{
                          expressions,
                          allowableTypes: allowableTypes.filter(item => item !== MultiTypeInputType.RUNTIME)
                        }}
                      />
                    ) : (
                      <FieldArray
                        name={name}
                        render={arrayHelpers => (
                          <>
                            {map(filePaths, (_: string, i: number) => (
                              <Layout.Horizontal
                                key={`${name}-${i}`}
                                flex={{ distribution: 'space-between' }}
                                style={{ alignItems: 'end' }}
                              >
                                <Layout.Horizontal
                                  spacing="medium"
                                  style={{ alignItems: 'baseline' }}
                                  className={css.formContainer}
                                  key={`${name}-${i}`}
                                  draggable={true}
                                  onDragEnd={onDragEnd}
                                  onDragOver={onDragOver}
                                  onDragLeave={onDragLeave}
                                  onDragStart={event => {
                                    /* istanbul ignore next */
                                    onDragStart(event, i)
                                  }}
                                  onDrop={event => {
                                    /* istanbul ignore next */
                                    onDrop(event, arrayHelpers, i)
                                  }}
                                >
                                  <Icon name="drag-handle-vertical" className={css.drag} />
                                  <Text width={12}>{`${i + 1}.`}</Text>
                                  <FormInput.MultiTextInput
                                    name={`${name}[${i}]`}
                                    label=""
                                    multiTextInputProps={{
                                      expressions,
                                      allowableTypes: allowableTypes.filter(item => item !== MultiTypeInputType.RUNTIME)
                                    }}
                                    style={{ width: 320 }}
                                  />
                                  <Button
                                    minimal
                                    icon="main-trash"
                                    data-testid={`remove-header-${i}`}
                                    onClick={() => arrayHelpers.remove(i)}
                                  />
                                </Layout.Horizontal>
                              </Layout.Horizontal>
                            ))}
                            <Button
                              icon="plus"
                              variation={ButtonVariation.LINK}
                              data-testid="add-header"
                              onClick={() => arrayHelpers.push('')}
                            >
                              {getString('cd.addTFVarFileLabel')}
                            </Button>
                          </>
                        )}
                      />
                    )}
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

export default StepTwo
