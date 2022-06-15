import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import {
  MultiTypeInputType,
  Formik,
  FormikForm,
  Layout,
  Button,
  ButtonVariation,
  useToaster,
  Text
} from '@harness/uicore'
import { Spinner } from '@blueprintjs/core'
import type { FormikErrors } from 'formik'

import { ExecutionNode, useGetExecutionInputTemplate, useSubmitExecutionInput } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import type { ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import type { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { yamlParse, yamlStringify } from '@common/utils/YamlHelperMethods'
import type { StepElementConfig } from 'services/cd-ng'
import useRBACError, { RBACError } from '@rbac/utils/useRBACError/useRBACError'
import { clearRuntimeInput } from '@pipeline/components/PipelineStudio/StepUtil'

import css from './ExecutionInputs.module.scss'

export interface ExecutionInputsProps {
  step: ExecutionNode
}

export function ExecutionInputs(props: ExecutionInputsProps): React.ReactElement {
  const { step } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ExecutionPathProps>()
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const nodeExecutionId = defaultTo(step.uuid, '')
  const { data, loading } = useGetExecutionInputTemplate({
    nodeExecutionId,
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier },
    lazy: !step.uuid
  })

  const { mutate: submitInput } = useSubmitExecutionInput({
    nodeExecutionId,
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier },
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const stepType = step.stepType as StepType
  const template = yamlParse<{ step: StepElementConfig }>(defaultTo(data?.data?.inputTemplate, '{}'))
  const parsedStep = defaultTo(template.step, {})
  const initialValues = clearRuntimeInput(parsedStep, true) // TODO: handle default values
  const stepDef = factory.getStep<Partial<StepElementConfig>>(stepType)

  function handleValidation(formData: Partial<StepElementConfig>): FormikErrors<Partial<StepElementConfig>> {
    return (
      stepDef?.validateInputSet({
        data: formData,
        template: parsedStep,
        viewType: StepViewType.DeploymentForm,
        getString
      }) || {}
    )
  }

  async function handleSubmit(formData: Partial<StepElementConfig>): Promise<Partial<StepElementConfig>> {
    try {
      await submitInput(yamlStringify({ step: formData }))
      setHasSubmitted(true)
      showSuccess(getString('common.dataSubmitSuccess'))
    } catch (e: unknown) {
      showError(getRBACErrorMessage(e as RBACError))
    }
    return formData
  }

  return (
    <div className={css.main}>
      {loading ? (
        <Spinner />
      ) : hasSubmitted ? (
        <Text>{getString('pipeline.runtimeInputsSubmittedMsg')}</Text>
      ) : (
        <Formik<Partial<StepElementConfig>>
          formName="execution-input"
          validate={handleValidation}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          <FormikForm>
            <StepWidget<Partial<StepElementConfig>>
              factory={factory}
              type={stepType}
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
              stepViewType={StepViewType.DeploymentForm}
              initialValues={initialValues}
              template={parsedStep}
            />
            <Layout.Horizontal spacing="medium">
              <Button type="submit" variation={ButtonVariation.PRIMARY}>
                {getString('submit')}
              </Button>
              <Button intent="danger" variation={ButtonVariation.PRIMARY}>
                {getString('pipeline.execution.actions.abortPipeline')}
              </Button>
            </Layout.Horizontal>
          </FormikForm>
        </Formik>
      )}
    </div>
  )
}
