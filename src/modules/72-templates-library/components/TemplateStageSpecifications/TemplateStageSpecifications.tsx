/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import { debounce, defaultTo, isEqual, merge, noop, omit, set } from 'lodash-es'
import { Card, Container, Formik, FormikForm, Heading, Layout, PageError, Text } from '@wings-software/uicore'
import * as Yup from 'yup'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { parse } from 'yaml'
import type { FormikProps } from 'formik'
import produce from 'immer'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { Error, StageElementConfig } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { PageSpinner } from '@common/components'
import {
  getIdentifierFromValue,
  getScopeBasedProjectPathParams,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import type { ProjectPathProps, GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { useToaster } from '@common/exports'
import { useGetTemplate, useGetTemplateInputSetYaml } from 'services/template-ng'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StageForm } from '@pipeline/components/PipelineInputSetForm/PipelineInputSetForm'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { TemplateTabs } from '@templates-library/components/TemplateStageSetupShell/TemplateStageSetupShellUtils'
import { validateStage } from '@pipeline/components/PipelineStudio/StepUtil'
import { useGlobalEventListener, useQueryParams } from '@common/hooks'
import ErrorsStripBinded from '@pipeline/components/ErrorsStrip/ErrorsStripBinded'
import { useStageTemplateActions } from '@pipeline/utils/useStageTemplateActions'
import { TemplateBar } from '@pipeline/components/PipelineStudio/TemplateBar/TemplateBar'
import { setTemplateInputs, TEMPLATE_INPUT_PATH } from '@pipeline/utils/templateUtils'
import { getTemplateRuntimeInputsCount } from '@templates-library/utils/templatesUtils'
import css from './TemplateStageSpecifications.module.scss'

declare global {
  interface WindowEventMap {
    SAVE_PIPELINE_CLICKED: CustomEvent<string>
  }
}

export interface TemplateStageValues extends StageElementConfig {
  inputsTemplate?: StageElementConfig
  allValues?: StageElementConfig
}

export const TemplateStageSpecifications = (): JSX.Element => {
  const {
    state: {
      selectionState: { selectedStageId = '' }
    },
    allowableTypes,
    updateStage,
    isReadonly,
    getStageFromPipeline
  } = usePipelineContext()
  const { stage } = getStageFromPipeline(selectedStageId)
  const queryParams = useParams<ProjectPathProps>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()
  const [formValues, setFormValues] = React.useState<TemplateStageValues>(stage?.stage as TemplateStageValues)
  const templateRef = getIdentifierFromValue(defaultTo(stage?.stage?.template?.templateRef, ''))
  const scope = getScopeFromValue(defaultTo(stage?.stage?.template?.templateRef, ''))
  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)
  const formikRef = React.useRef<FormikProps<unknown> | null>(null)
  const { submitFormsForTab } = useContext(StageErrorContext)
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  const [templateInputsCount, setTemplateInputsCount] = React.useState<number>(0)

  const onChange = React.useCallback(
    debounce(async (values: StageElementConfig): Promise<void> => {
      await updateStage({ ...stage?.stage, ...values })
    }, 300),
    [stage?.stage, updateStage]
  )

  const {
    data: templateResponse,
    error: templateError,
    refetch: refetchTemplate,
    loading: templateLoading
  } = useGetTemplate({
    templateIdentifier: templateRef,
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, scope),
      versionLabel: defaultTo(stage?.stage?.template?.versionLabel, ''),
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  })

  const {
    data: templateInputSetYaml,
    error: templateInputSetError,
    refetch: refetchTemplateInputSet,
    loading: templateInputSetLoading
  } = useGetTemplateInputSetYaml({
    templateIdentifier: templateRef,
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, scope),
      versionLabel: defaultTo(stage?.stage?.template?.versionLabel, ''),
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  })

  React.useEffect(() => {
    if (!templateLoading && !templateInputSetLoading && stage?.stage && templateResponse?.data?.yaml) {
      try {
        const templateInputs = parse(defaultTo(templateInputSetYaml?.data, ''))
        const mergedTemplateInputs = merge({}, templateInputs, stage?.stage.template?.templateInputs)
        setFormValues(
          produce(stage?.stage as TemplateStageValues, draft => {
            setTemplateInputs(draft, mergedTemplateInputs)
            draft.inputsTemplate = templateInputs
            draft.allValues = {
              ...parse(defaultTo(templateResponse?.data?.yaml, '')).template.spec,
              identifier: stage.stage?.identifier
            }
          })
        )
        setTemplateInputsCount(getTemplateRuntimeInputsCount(mergedTemplateInputs))
        setTemplateInputs(stage.stage, mergedTemplateInputs)
        updateStage(stage.stage)
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'template.parse.inputSet.error')
      }
    }
  }, [templateLoading, templateResponse?.data && templateInputSetLoading && templateInputSetYaml?.data])

  React.useEffect(() => {
    subscribeForm({ tab: TemplateTabs.OVERVIEW, form: formikRef })
    return () => unSubscribeForm({ tab: TemplateTabs.OVERVIEW, form: formikRef })
  }, [subscribeForm, unSubscribeForm, formikRef])

  useGlobalEventListener('SAVE_PIPELINE_CLICKED', _event => {
    submitFormsForTab(TemplateTabs.OVERVIEW)
  })

  const validateForm = (values: TemplateStageValues) => {
    if (
      isEqual(values.template?.templateRef, stage?.stage?.template?.templateRef) &&
      isEqual(values.template?.versionLabel, stage?.stage?.template?.versionLabel)
    ) {
      onChange?.(omit(values, 'inputsTemplate', 'allValues'))
      const errorsResponse = validateStage({
        stage: values.template?.templateInputs as StageElementConfig,
        template: values.inputsTemplate,
        originalStage: stage?.stage?.template?.templateInputs as StageElementConfig,
        getString,
        viewType: StepViewType.DeploymentForm
      })
      return set({}, TEMPLATE_INPUT_PATH, errorsResponse)
    } else {
      return {}
    }
  }

  const refetch = () => {
    refetchTemplate()
    refetchTemplateInputSet()
  }

  const { addOrUpdateTemplate, removeTemplate } = useStageTemplateActions()

  const formRefDom = React.useRef<HTMLElement | undefined>()

  return (
    <Container className={css.serviceOverrides} height={'100%'} background={Color.FORM_BG}>
      <ErrorsStripBinded domRef={formRefDom} />
      <Layout.Vertical
        spacing={'xlarge'}
        className={css.contentSection}
        ref={ref => {
          formRefDom.current = ref as HTMLElement
        }}
      >
        {stage?.stage?.template && (
          <TemplateBar
            templateLinkConfig={stage?.stage.template}
            onRemoveTemplate={removeTemplate}
            onOpenTemplateSelector={addOrUpdateTemplate}
            className={css.templateBar}
          />
        )}
        <Formik<TemplateStageValues>
          initialValues={formValues}
          formName="templateStageOverview"
          onSubmit={noop}
          validate={validateForm}
          validationSchema={Yup.object().shape({
            name: NameSchema({
              requiredErrorMsg: getString('pipelineSteps.build.create.stageNameRequiredError')
            }),
            identifier: IdentifierSchema()
          })}
          enableReinitialize={true}
        >
          {(formik: FormikProps<TemplateStageValues>) => {
            window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: TemplateTabs.OVERVIEW }))
            formikRef.current = formik as FormikProps<unknown> | null
            return (
              <FormikForm>
                <Card className={css.sectionCard}>
                  <NameId
                    identifierProps={{
                      inputLabel: getString('stageNameLabel'),
                      isIdentifierEditable: false,
                      inputGroupProps: { disabled: isReadonly }
                    }}
                    inputGroupProps={{ placeholder: getString('common.namePlaceholder') }}
                  />
                </Card>
                <Container className={css.inputsContainer}>
                  {(templateLoading || templateInputSetLoading) && <PageSpinner />}
                  {!templateLoading && !templateInputSetLoading && (templateError || templateInputSetError) && (
                    <Container height={300}>
                      <PageError
                        message={
                          defaultTo((templateError?.data as Error)?.message, templateError?.message) ||
                          defaultTo((templateInputSetError?.data as Error)?.message, templateInputSetError?.message)
                        }
                        onClick={() => refetch()}
                      />
                    </Container>
                  )}
                  {!templateLoading &&
                    !templateInputSetLoading &&
                    !templateError &&
                    !templateInputSetError &&
                    formik.values.inputsTemplate &&
                    formik.values.allValues && (
                      <Layout.Vertical
                        margin={{ top: 'medium' }}
                        padding={{ top: 'large', bottom: 'large' }}
                        spacing={'large'}
                      >
                        <Layout.Horizontal flex={{ distribution: 'space-between' }}>
                          <Heading level={5} color={Color.BLACK}>
                            {getString('pipeline.templateInputs')}
                          </Heading>
                          <Text font={{ size: 'normal' }}>
                            {getString('templatesLibrary.inputsCount', { count: templateInputsCount })}
                          </Text>
                        </Layout.Horizontal>
                        <StageForm
                          key={`${formik.values.template?.templateRef}-${defaultTo(
                            formik.values.template?.versionLabel,
                            ''
                          )}`}
                          template={{ stage: formik.values.inputsTemplate }}
                          allValues={{ stage: formik.values.allValues }}
                          path={TEMPLATE_INPUT_PATH}
                          readonly={isReadonly}
                          viewType={StepViewType.InputSet}
                          hideTitle={true}
                          stageClassName={css.stageCard}
                          allowableTypes={allowableTypes}
                        />
                      </Layout.Vertical>
                    )}
                </Container>
              </FormikForm>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </Container>
  )
}
