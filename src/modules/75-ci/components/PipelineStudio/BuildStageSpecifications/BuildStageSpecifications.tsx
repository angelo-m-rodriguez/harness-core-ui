/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import * as yup from 'yup'
import { Accordion, Card, Formik, FormikForm, Switch, Text, MultiTypeInputType } from '@wings-software/uicore'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { cloneDeep, debounce, defaultTo, isEqual, uniqBy } from 'lodash-es'
import cx from 'classnames'
import { produce } from 'immer'
import type { FormikProps } from 'formik'
import { NameIdDescriptionTags } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import type { AllNGVariables } from '@pipeline/utils/types'
import type { NGVariable, StageElementConfig, StringNGVariable } from 'services/cd-ng'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type {
  CustomVariableEditableExtraProps,
  CustomVariablesData
} from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariableEditable'
import { usePipelineVariables } from '@pipeline/components/PipelineVariablesContext/PipelineVariablesContext'
import { useStrings } from 'framework/strings'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { NameSchema } from '@common/utils/Validation'
import MultiTypeList from '@common/components/MultiTypeList/MultiTypeList'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { BuildStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import ErrorsStripBinded from '@pipeline/components/ErrorsStrip/ErrorsStripBinded'
import { isContextTypeNotStageTemplate } from '@pipeline/components/PipelineStudio/PipelineUtils'
import { BuildTabs } from '../CIPipelineStagesUtils'
import css from './BuildStageSpecifications.module.scss'

const logger = loggerFor(ModuleName.CD)

export interface Variable {
  name: string
  type: string
  value?: string
}

export default function BuildStageSpecifications({ children }: React.PropsWithChildren<unknown>): JSX.Element {
  const { variablesPipeline, metadataMap } = usePipelineVariables()

  const { getString } = useStrings()

  const {
    state: {
      selectionState: { selectedStageId }
    },
    getStageFromPipeline,
    updateStage,
    stepsFactory,
    contextType,
    allowableTypes,
    isReadonly
  } = usePipelineContext()

  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  const { stage } = getStageFromPipeline<BuildStageElementConfig>(selectedStageId || '')

  const getInitialValues = (): {
    identifier: string
    name: string
    description: string
    tags?: { [key: string]: string }
    cloneCodebase: boolean
    sharedPaths: string[]
    variables: NGVariable[]
  } => {
    const pipelineData = stage?.stage || null
    const spec = stage?.stage?.spec || null

    const identifier = pipelineData?.identifier || ''
    const name = pipelineData?.name || ''
    const description = pipelineData?.description || ''
    const tags = pipelineData?.tags
    const cloneCodebase = !!spec?.cloneCodebase
    const sharedPaths =
      typeof spec?.sharedPaths === 'string'
        ? spec?.sharedPaths
        : (spec?.sharedPaths as any)
            ?.filter((path: string) => !!path)
            ?.map((_value: string) => ({
              id: uuid('', nameSpace()),
              value: _value
            })) || []
    const variables = pipelineData?.variables || []

    return {
      identifier,
      name,
      description,
      tags,
      cloneCodebase,
      sharedPaths: sharedPaths as any,
      variables
    }
  }

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  const formikRef = React.useRef<FormikProps<unknown> | null>(null)

  React.useEffect(() => {
    subscribeForm({ tab: BuildTabs.OVERVIEW, form: formikRef })
    return () => unSubscribeForm({ tab: BuildTabs.OVERVIEW, form: formikRef })
  }, [])

  const validationSchema = yup.object().shape({
    ...(isContextTypeNotStageTemplate(contextType) && { name: NameSchema() }),
    sharedPaths: yup.lazy(value => {
      if (Array.isArray(value)) {
        return yup.array().test('valuesShouldBeUnique', getString('validation.uniqueValues'), list => {
          if (!list) return true

          return uniqBy(list, 'value').length === list.length
        })
      } else {
        return yup.string()
      }
    })
  })

  const handleValidate = (values: any): void => {
    if (stage?.stage) {
      const prevStageData = cloneDeep(stage.stage)
      const newStageData = produce(stage.stage, (stageData: any) => {
        const spec = stageData.spec

        stageData.identifier = values.identifier
        stageData.name = values.name

        if (values.description) {
          stageData.description = values.description
        } else {
          delete stageData.description
        }

        if (values.tags) {
          stageData.tags = values.tags
        } else {
          delete stageData.tags
        }

        spec.cloneCodebase = values.cloneCodebase

        if (values.sharedPaths && values.sharedPaths.length > 0) {
          spec.sharedPaths =
            typeof values.sharedPaths === 'string'
              ? values.sharedPaths
              : values.sharedPaths.map((listValue: { id: string; value: string }) => listValue.value)
        } else {
          delete spec.sharedPaths
        }

        if (values.variables && values.variables.length > 0) {
          stageData.variables = values.variables
        } else {
          delete stageData.variables
        }

        if (values.skipCondition) {
          stageData.skipCondition = values.skipCondition
        } else {
          delete stageData.skipCondition
        }
      })

      if (!isEqual(prevStageData, newStageData)) {
        updateStage(newStageData as unknown as StageElementConfig)
      }
    }
  }

  const debounceHandleValidate = React.useRef(
    debounce((values: any) => {
      return handleValidate(values)
    }, 500)
  ).current

  const handleStepWidgetUpdate = React.useCallback(
    debounce((values: StageElementConfig): void => {
      updateStage({ ...stage?.stage, ...values })
    }, 300),
    [stage?.stage, updateStage]
  )

  // Cleanup debounce
  useEffect(() => {
    return () => {
      debounceHandleValidate.flush()
    }
  }, [])

  const { expressions } = useVariablesExpression()

  return (
    <div className={css.wrapper}>
      <ErrorsStripBinded domRef={scrollRef as React.MutableRefObject<HTMLElement | undefined>} />
      <div className={css.contentSection} ref={scrollRef}>
        <Formik
          initialValues={getInitialValues()}
          validationSchema={validationSchema}
          validate={debounceHandleValidate}
          formName="ciBuildStage"
          onSubmit={values => logger.info(JSON.stringify(values))}
        >
          {formik => {
            const { values: formValues, setFieldValue } = formik
            window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: BuildTabs.OVERVIEW }))
            formikRef.current = formik as FormikProps<unknown> | null
            return (
              <>
                <div className={css.tabHeading} id="stageDetails">
                  {getString('stageDetails')}
                </div>
                <Card className={cx(css.sectionCard)} disabled={isReadonly}>
                  <FormikForm>
                    {isContextTypeNotStageTemplate(contextType) && (
                      <NameIdDescriptionTags
                        formikProps={formik}
                        identifierProps={{
                          isIdentifierEditable: false,
                          inputGroupProps: { disabled: isReadonly }
                        }}
                        descriptionProps={{ disabled: isReadonly }}
                        tagsProps={{ disabled: isReadonly }}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Switch
                        checked={formValues.cloneCodebase}
                        label={getString('cloneCodebaseLabel')}
                        onChange={e => setFieldValue('cloneCodebase', e.currentTarget.checked)}
                        disabled={isReadonly}
                        tooltipProps={{ tooltipId: 'cloneCodebase' }}
                      />
                    </div>
                  </FormikForm>
                </Card>

                <div className={css.tabHeading} id="sharedPaths">
                  {getString('pipelineSteps.build.stageSpecifications.sharedPaths')}
                </div>
                <Card disabled={isReadonly} className={cx(css.sectionCard)}>
                  <FormikForm className={cx(css.fields, css.contentCard)}>
                    <MultiTypeList
                      name="sharedPaths"
                      multiTextInputProps={{
                        expressions,
                        allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
                      }}
                      multiTypeFieldSelectorProps={{
                        label: (
                          <Text tooltipProps={{ dataTooltipId: 'stageSpecificationsSharedPaths' }}>
                            {getString('pipelineSteps.build.stageSpecifications.sharedPaths')}
                          </Text>
                        ),
                        allowedTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
                      }}
                      disabled={isReadonly}
                    />
                  </FormikForm>
                </Card>

                <Accordion className={css.accordionTitle} activeId="">
                  <Accordion.Panel
                    id="advanced"
                    addDomId={true}
                    summary={
                      <div
                        className={css.tabHeading}
                        id="advanced"
                        style={{ paddingLeft: 'var(--spacing-small)', marginBottom: 0 }}
                      >
                        {getString('advancedTitle')}
                      </div>
                    }
                    details={
                      <Card
                        className={(css.sectionCard, css.sectionCardVariables)}
                        id="variables"
                        style={{ width: '100%' }}
                      >
                        <div className={css.tabSubHeading}>{getString('pipeline.stageVariables')}</div>
                        <Text style={{ color: 'var(--grey-500)', lineHeight: '24px' }}>
                          {getString('workflowVariableInfo')}
                        </Text>
                        <div className={css.stageSection}>
                          <div className={css.stageDetails}>
                            <StepWidget<CustomVariablesData, CustomVariableEditableExtraProps>
                              factory={stepsFactory}
                              readonly={isReadonly}
                              initialValues={{
                                variables: ((stage?.stage as StageElementConfig)?.variables || []) as AllNGVariables[],
                                canAddVariable: true
                              }}
                              allowableTypes={allowableTypes}
                              type={StepType.CustomVariable}
                              stepViewType={StepViewType.StageVariable}
                              onUpdate={({ variables }: CustomVariablesData) => {
                                handleStepWidgetUpdate({ ...stage?.stage, variables } as StageElementConfig)
                              }}
                              customStepProps={{
                                formName: 'addEditStageCustomVariableForm',
                                yamlProperties: defaultTo(
                                  getStageFromPipeline<BuildStageElementConfig>(
                                    stage?.stage?.identifier || '',
                                    variablesPipeline
                                  )?.stage?.stage?.variables?.map?.(
                                    variable =>
                                      metadataMap[(variable as StringNGVariable).value || '']?.yamlProperties || {}
                                  ),
                                  []
                                )
                              }}
                            />
                          </div>
                        </div>
                      </Card>
                    }
                  />
                </Accordion>
              </>
            )
          }}
        </Formik>
        {children}
      </div>
    </div>
  )
}
