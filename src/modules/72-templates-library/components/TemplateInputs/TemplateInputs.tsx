/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Container,
  MultiTypeInputType,
  Text,
  Layout,
  Formik,
  getMultiTypeFromValue,
  PageError
} from '@wings-software/uicore'
import { parse } from 'yaml'
import { Color } from '@harness/design-system'
import { defaultTo, noop } from 'lodash-es'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import {
  TemplateSummaryResponse,
  useGetTemplateInputSetYaml,
  useGetYamlWithTemplateRefsResolved
} from 'services/template-ng'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import type { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { PageSpinner, useToaster } from '@common/components'
import type {
  StageElementConfig,
  StepElementConfig,
  StageElementWrapperConfig,
  PipelineInfoConfig
} from 'services/cd-ng'
import type { NGTemplateInfoConfigWithGitDetails } from 'framework/Templates/TemplateConfigModal/TemplateConfigModal'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import MultiTypeDelegateSelector from '@common/components/MultiTypeDelegateSelector/MultiTypeDelegateSelector'
import { useStrings } from 'framework/strings'
import { PipelineInputSetFormInternal, StageForm } from '@pipeline/components/PipelineInputSetForm/PipelineInputSetForm'
import { getTemplateRuntimeInputsCount, TemplateType } from '@templates-library/utils/templatesUtils'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import { getTemplateNameWithLabel } from '@pipeline/utils/templateUtils'
import { useMutateAsGet } from '@common/hooks'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './TemplateInputs.module.scss'

export interface TemplateInputsProps {
  template: TemplateSummaryResponse | NGTemplateInfoConfigWithGitDetails
}

export const TemplateInputs: React.FC<TemplateInputsProps> = props => {
  const { template } = props
  const [inputSetTemplate, setInputSetTemplate] = React.useState<StepElementConfig | StageElementConfig | null>()
  const [count, setCount] = React.useState<number>(0)
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const allowableTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION, MultiTypeInputType.RUNTIME]
  const templateEntityType =
    (template as TemplateSummaryResponse).templateEntityType || (template as NGTemplateInfoConfigWithGitDetails).type
  const repo =
    (template as TemplateSummaryResponse).gitDetails?.repoIdentifier ||
    (template as NGTemplateInfoConfigWithGitDetails).repo
  const branch =
    (template as TemplateSummaryResponse).gitDetails?.branch || (template as NGTemplateInfoConfigWithGitDetails).branch

  const {
    data: templateInputYaml,
    error: inputSetError,
    refetch,
    loading
  } = useGetTemplateInputSetYaml({
    templateIdentifier: defaultTo(template.identifier, ''),
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: template.orgIdentifier,
      projectIdentifier: template.projectIdentifier,
      versionLabel: defaultTo(template.versionLabel, ''),
      repoIdentifier: repo,
      branch: branch,
      getDefaultFromOtherRepo: true
    }
  })

  React.useEffect(() => {
    try {
      const templateInput = parse(templateInputYaml?.data || '')
      setCount(getTemplateRuntimeInputsCount(templateInput))
      setInputSetTemplate(templateInput)
    } catch (error) {
      showError(getRBACErrorMessage(error), undefined, 'template.parse.inputSet.error')
    }
  }, [templateInputYaml?.data])

  const initialValues = React.useMemo(() => {
    switch (templateEntityType) {
      case TemplateType.Step:
        return inputSetTemplate as StepElementConfig
      case TemplateType.Stage:
        return { stage: inputSetTemplate } as StageElementWrapperConfig
      case TemplateType.Pipeline:
        return inputSetTemplate as PipelineInfoConfig
      default:
        return {}
    }
  }, [templateEntityType, inputSetTemplate])

  const originalTemplate = (template as TemplateSummaryResponse).yaml
    ? parse(defaultTo((template as TemplateSummaryResponse).yaml, '')).template
    : (template as NGTemplateInfoConfigWithGitDetails)

  const {
    data: resolvedTemplateResponse,
    loading: loadingResolvedTemplate,
    error: errorResolvedTemplate,
    refetch: refetchResolvedTemplate
  } = useMutateAsGet(useGetYamlWithTemplateRefsResolved, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: template.orgIdentifier,
      projectIdentifier: template.projectIdentifier,
      repoIdentifier: repo,
      branch: branch,
      getDefaultFromOtherRepo: true
    },
    body: {
      originalEntityYaml: yamlStringify(originalTemplate)
    }
  })

  const originalValues = React.useMemo(() => {
    const templateSpec = parse(resolvedTemplateResponse?.data?.mergedPipelineYaml || '')?.spec
    if (templateEntityType === TemplateType.Stage) {
      return { stage: templateSpec }
    } else {
      return templateSpec
    }
  }, [templateEntityType, resolvedTemplateResponse?.data?.mergedPipelineYaml])

  return (
    <Container
      style={{ overflow: 'auto' }}
      padding={{ top: 'xlarge', left: 'xxlarge', right: 'xxlarge' }}
      className={css.container}
    >
      <Layout.Vertical>
        {(loading || loadingResolvedTemplate) && <PageSpinner />}
        {!loading && !loadingResolvedTemplate && (inputSetError || errorResolvedTemplate) && (
          <>
            {inputSetError && (
              <Container height={300}>
                <PageError
                  message={defaultTo((inputSetError.data as Error)?.message, inputSetError.message)}
                  onClick={() => refetch()}
                />
              </Container>
            )}
            {errorResolvedTemplate && (
              <Container height={300}>
                <PageError
                  message={defaultTo((errorResolvedTemplate.data as Error)?.message, errorResolvedTemplate.message)}
                  onClick={() => refetchResolvedTemplate()}
                />
              </Container>
            )}
          </>
        )}
        {!loading && !loadingResolvedTemplate && !inputSetError && !errorResolvedTemplate && !inputSetTemplate && (
          <Container height={300}>
            <NoResultsView minimal={true} text={getString('templatesLibrary.noInputsRequired')} />
          </Container>
        )}
        {!loading &&
          !loadingResolvedTemplate &&
          !inputSetError &&
          !errorResolvedTemplate &&
          inputSetTemplate &&
          originalValues && (
            <Container className={css.inputsContainer}>
              <Layout.Vertical spacing={'xlarge'}>
                <Container>
                  <Layout.Horizontal flex={{ alignItems: 'center' }} spacing={'xxxlarge'}>
                    <Text font={{ size: 'normal', weight: 'bold' }} color={Color.GREY_800}>
                      {getTemplateNameWithLabel(template)}
                    </Text>
                    <Text className={css.inputsCount} font={{ size: 'small' }}>
                      {getString('templatesLibrary.inputsCount', { count })}
                    </Text>
                  </Layout.Horizontal>
                </Container>
                <Formik<StepElementConfig | StageElementWrapperConfig | PipelineInfoConfig>
                  onSubmit={noop}
                  initialValues={initialValues}
                  formName="templateInputs"
                  enableReinitialize={true}
                >
                  {formikProps => {
                    return (
                      <>
                        {templateEntityType === TemplateType.Pipeline && (
                          <PipelineInputSetFormInternal
                            originalPipeline={originalValues as PipelineInfoConfig}
                            template={formikProps.values as PipelineInfoConfig}
                            readonly={true}
                            viewType={StepViewType.InputSet}
                            allowableTypes={allowableTypes}
                            viewTypeMetadata={{ isTemplateDetailDrawer: true }}
                          />
                        )}
                        {templateEntityType === TemplateType.Stage && (
                          <StageForm
                            template={formikProps.values as StageElementWrapperConfig}
                            allValues={originalValues as StageElementWrapperConfig}
                            path={'stage'}
                            readonly={true}
                            viewType={StepViewType.InputSet}
                            allowableTypes={allowableTypes}
                            hideTitle={true}
                            stageClassName={css.stageCard}
                          />
                        )}
                        {templateEntityType === TemplateType.Step && (
                          <Container
                            className={css.inputsCard}
                            background={Color.WHITE}
                            padding={'large'}
                            margin={{ bottom: 'xxlarge' }}
                          >
                            <StepWidget<Partial<StepElementConfig>>
                              factory={factory}
                              initialValues={formikProps.values as StepElementConfig}
                              template={originalValues as StepElementConfig}
                              readonly={true}
                              type={(formikProps.values as StepElementConfig)?.type as StepType}
                              stepViewType={StepViewType.InputSet}
                              allowableTypes={allowableTypes}
                            />
                            {getMultiTypeFromValue(
                              (formikProps.values as StepElementConfig).spec?.delegateSelectors
                            ) === MultiTypeInputType.RUNTIME && (
                              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                                <MultiTypeDelegateSelector
                                  inputProps={{
                                    projectIdentifier: template.projectIdentifier,
                                    orgIdentifier: template.orgIdentifier
                                  }}
                                  allowableTypes={allowableTypes}
                                  label={getString('delegate.DelegateSelector')}
                                  name={'spec.delegateSelectors'}
                                  disabled={true}
                                />
                              </div>
                            )}
                          </Container>
                        )}
                      </>
                    )
                  }}
                </Formik>
              </Layout.Vertical>
            </Container>
          )}
      </Layout.Vertical>
    </Container>
  )
}
