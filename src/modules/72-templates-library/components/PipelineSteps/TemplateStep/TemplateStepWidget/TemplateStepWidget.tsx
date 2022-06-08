/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Container,
  Formik,
  FormikForm,
  FormInput,
  Layout,
  MultiTypeInputType,
  Heading,
  PageError,
  Text
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import type { FormikProps } from 'formik'
import { useParams } from 'react-router-dom'
import { parse } from 'yaml'
import { defaultTo, get, isEmpty, merge, noop, set } from 'lodash-es'
import produce from 'immer'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { setFormikRef, StepViewType, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'
import type { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import type { Error, StepElementConfig } from 'services/cd-ng'
import type { ProjectPathProps, GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useGetTemplate, useGetTemplateInputSetYaml } from 'services/template-ng'
import { useToaster } from '@common/exports'
import { PageSpinner } from '@common/components'
import {
  getIdentifierFromValue,
  getScopeBasedProjectPathParams,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import type { TemplateStepNode } from 'services/pipeline-ng'
import { validateStep } from '@pipeline/components/PipelineStudio/StepUtil'
import { StepForm } from '@pipeline/components/PipelineInputSetForm/StageInputSetForm'
import { setTemplateInputs, TEMPLATE_INPUT_PATH } from '@pipeline/utils/templateUtils'
import { getTemplateRuntimeInputsCount } from '@templates-library/utils/templatesUtils'
import { useQueryParams } from '@common/hooks'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './TemplateStepWidget.module.scss'

export interface TemplateStepWidgetProps {
  initialValues: TemplateStepNode
  isNewStep?: boolean
  isDisabled?: boolean
  onUpdate?: (data: TemplateStepNode) => void
  stepViewType?: StepViewType
  readonly?: boolean
  factory: AbstractStepFactory
  allowableTypes: MultiTypeInputType[]
}

export interface TemplateStepValues extends TemplateStepNode {
  inputsTemplate?: StepElementConfig
  allValues?: StepElementConfig
}

function TemplateStepWidget(
  props: TemplateStepWidgetProps,
  formikRef: StepFormikFowardRef<TemplateStepNode>
): React.ReactElement {
  const { initialValues, onUpdate, isNewStep, readonly, allowableTypes } = props
  const [formValues, setFormValues] = React.useState<TemplateStepValues>(initialValues)
  const { getString } = useStrings()
  const queryParams = useParams<ProjectPathProps>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const stepTemplateRef = getIdentifierFromValue(initialValues.template.templateRef)
  const scope = getScopeFromValue(initialValues.template.templateRef)
  const [templateInputsCount, setTemplateInputsCount] = React.useState<number>(0)

  const {
    data: stepTemplateResponse,
    error: stepTemplateError,
    refetch: refetchStepTemplate,
    loading: stepTemplateLoading
  } = useGetTemplate({
    templateIdentifier: stepTemplateRef,
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, scope),
      versionLabel: defaultTo(initialValues.template.versionLabel, ''),
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  })

  const {
    data: stepTemplateInputSetYaml,
    error: stepTemplateInputSetError,
    refetch: refetchStepTemplateInputSet,
    loading: stepTemplateInputSetLoading
  } = useGetTemplateInputSetYaml({
    templateIdentifier: stepTemplateRef,
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, scope),
      versionLabel: defaultTo(initialValues.template.versionLabel, ''),
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  })

  React.useEffect(() => {
    if (!stepTemplateLoading && !stepTemplateInputSetLoading && stepTemplateResponse?.data?.yaml) {
      try {
        const templateInputs = parse(defaultTo(stepTemplateInputSetYaml?.data, ''))
        const mergedTemplateInputs = merge({}, templateInputs, initialValues.template?.templateInputs)
        setFormValues(
          produce(initialValues as TemplateStepValues, draft => {
            setTemplateInputs(draft, mergedTemplateInputs)
            draft.inputsTemplate = templateInputs
            draft.allValues = parse(defaultTo(stepTemplateResponse?.data?.yaml, '')).template.spec
          })
        )
        setTemplateInputsCount(getTemplateRuntimeInputsCount(mergedTemplateInputs))
        setTemplateInputs(initialValues, mergedTemplateInputs)
        onUpdate?.(initialValues)
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'template.parse.inputSet.error')
      }
    }
  }, [stepTemplateLoading, stepTemplateResponse?.data && stepTemplateInputSetLoading && stepTemplateInputSetYaml?.data])

  const validateForm = (values: TemplateStepValues) => {
    const errorsResponse = validateStep({
      step: values.template?.templateInputs as StepElementConfig,
      template: values.inputsTemplate,
      originalStep: { step: formValues?.template?.templateInputs as StepElementConfig },
      getString,
      viewType: StepViewType.DeploymentForm
    })
    if (!isEmpty(errorsResponse)) {
      return set({}, TEMPLATE_INPUT_PATH, get(errorsResponse, 'step'))
    } else {
      return errorsResponse
    }
  }

  const refetch = () => {
    refetchStepTemplate()
    refetchStepTemplateInputSet()
  }

  return (
    <div className={stepCss.stepPanel}>
      <Formik<TemplateStepValues>
        onSubmit={values => {
          onUpdate?.(values)
        }}
        initialValues={formValues}
        formName="templateStepWidget"
        validationSchema={Yup.object().shape({
          name: NameSchema({ requiredErrorMsg: getString('pipelineSteps.stepNameRequired') }),
          identifier: IdentifierSchema()
        })}
        validate={validateForm}
        enableReinitialize={true}
      >
        {(formik: FormikProps<TemplateStepValues>) => {
          setFormikRef(formikRef, formik)
          return (
            <FormikForm>
              <div className={cx(stepCss.formGroup, stepCss.md)}>
                <FormInput.InputWithIdentifier
                  isIdentifierEditable={isNewStep && !readonly}
                  inputLabel={getString('name')}
                  inputGroupProps={{ disabled: readonly }}
                />
              </div>
              <Container className={css.inputsContainer}>
                {(stepTemplateLoading || stepTemplateInputSetLoading) && <PageSpinner />}
                {!stepTemplateLoading &&
                  !stepTemplateInputSetLoading &&
                  (stepTemplateError || stepTemplateInputSetError) && (
                    <Container height={300}>
                      <PageError
                        message={
                          defaultTo((stepTemplateError?.data as Error)?.message, stepTemplateError?.message) ||
                          defaultTo(
                            (stepTemplateInputSetError?.data as Error)?.message,
                            stepTemplateInputSetError?.message
                          )
                        }
                        onClick={() => refetch()}
                      />
                    </Container>
                  )}
                {!stepTemplateLoading &&
                  !stepTemplateInputSetLoading &&
                  !stepTemplateError &&
                  !stepTemplateInputSetError &&
                  formik.values.inputsTemplate &&
                  formik.values.allValues && (
                    <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} spacing={'large'}>
                      <Layout.Horizontal flex={{ distribution: 'space-between' }}>
                        <Heading level={5} color={Color.BLACK}>
                          {getString('pipeline.templateInputs')}
                        </Heading>
                        <Text font={{ size: 'normal' }}>
                          {getString('templatesLibrary.inputsCount', { count: templateInputsCount })}
                        </Text>
                      </Layout.Horizontal>
                      <StepForm
                        key={`${formik.values.template.templateRef}-${defaultTo(
                          formik.values.template.versionLabel,
                          ''
                        )}`}
                        template={{ step: formik.values.inputsTemplate }}
                        values={{ step: formik.values.template?.templateInputs as StepElementConfig }}
                        allValues={{ step: formik.values.allValues }}
                        readonly={readonly}
                        viewType={StepViewType.InputSet}
                        path={TEMPLATE_INPUT_PATH}
                        allowableTypes={allowableTypes}
                        onUpdate={noop}
                        hideTitle={true}
                      />
                    </Layout.Vertical>
                  )}
              </Container>
            </FormikForm>
          )
        }}
      </Formik>
    </div>
  )
}

export const TemplateStepWidgetWithRef = React.forwardRef(TemplateStepWidget)
