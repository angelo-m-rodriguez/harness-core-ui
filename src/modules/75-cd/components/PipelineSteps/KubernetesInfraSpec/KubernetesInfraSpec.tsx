/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import { debounce, noop, isEmpty, get } from 'lodash-es'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { FormikErrors, FormikProps, yupToFormErrors } from 'formik'

import {
  IconName,
  Text,
  Layout,
  Formik,
  FormikForm,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Icon,
  Accordion
} from '@wings-software/uicore'

import { useStrings } from 'framework/strings'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { K8SDirectInfrastructure, getConnectorListV2Promise } from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'

import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'

import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { getConnectorName, getConnectorValue } from '@pipeline/components/PipelineSteps/Steps/StepsHelper'

import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { getIconByType } from '@connectors/pages/connectors/utils/ConnectorUtils'

import { getConnectorSchema, getNameSpaceSchema, getReleaseNameSchema } from '../PipelineStepsUtil'

import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './KubernetesInfraSpec.module.scss'

const logger = loggerFor(ModuleName.CD)
type K8SDirectInfrastructureTemplate = { [key in keyof K8SDirectInfrastructure]: string }
interface KubernetesInfraSpecEditableProps {
  initialValues: K8SDirectInfrastructure
  onUpdate?: (data: K8SDirectInfrastructure) => void
  stepViewType?: StepViewType
  readonly?: boolean
  template?: K8SDirectInfrastructureTemplate
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: K8SDirectInfrastructure
  allowableTypes?: MultiTypeInputType[]
}

const KubernetesInfraSpecEditable: React.FC<KubernetesInfraSpecEditableProps> = ({
  initialValues,
  onUpdate,
  readonly,
  allowableTypes
}): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const delayedOnUpdate = React.useRef(debounce(onUpdate || noop, 300)).current
  const { expressions } = useVariablesExpression()
  const { getString } = useStrings()
  const validationSchema = Yup.object().shape({
    connectorRef: getConnectorSchema(getString),
    namespace: getNameSpaceSchema(getString),
    releaseName: getReleaseNameSchema(getString)
  })

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  const formikRef = React.useRef<FormikProps<unknown> | null>(null)

  React.useEffect(() => {
    subscribeForm({ tab: DeployTabs.INFRASTRUCTURE, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.INFRASTRUCTURE, form: formikRef })
  }, [])

  return (
    <Layout.Vertical spacing="medium">
      <Formik
        initialValues={initialValues}
        formName="k8InfraSpec"
        validate={value => {
          const data: Partial<K8SDirectInfrastructure> = {
            namespace: value.namespace === '' ? undefined : value.namespace,
            releaseName: value.releaseName === '' ? undefined : value.releaseName,
            connectorRef: undefined,
            allowSimultaneousDeployments: value.allowSimultaneousDeployments
          }
          if (value.connectorRef) {
            data.connectorRef = (value.connectorRef as any)?.value || value.connectorRef
          }
          delayedOnUpdate(data)
        }}
        validationSchema={validationSchema}
        onSubmit={noop}
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.INFRASTRUCTURE }))
          formikRef.current = formik as FormikProps<unknown> | null
          return (
            <FormikForm>
              <Layout.Horizontal spacing="medium" className={css.formRow}>
                <FormMultiTypeConnectorField
                  name="connectorRef"
                  label={getString('connector')}
                  tooltipProps={{
                    dataTooltipId: 'k8InfraConnector'
                  }}
                  placeholder={getString('connectors.selectConnector')}
                  disabled={readonly}
                  accountIdentifier={accountId}
                  multiTypeProps={{ expressions, disabled: readonly, allowableTypes }}
                  projectIdentifier={projectIdentifier}
                  orgIdentifier={orgIdentifier}
                  width={450}
                  connectorLabelClass={css.connectorRef}
                  enableConfigureOptions={false}
                  style={{ marginBottom: 'var(--spacing-large)' }}
                  gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                />
                {getMultiTypeFromValue(formik.values.connectorRef) === MultiTypeInputType.RUNTIME && !readonly && (
                  <ConfigureOptions
                    style={{ marginTop: `25px !important` }}
                    value={formik.values.connectorRef as string}
                    type={
                      <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
                        <Icon name={getIconByType('K8sCluster')}></Icon>
                        <Text>{getString('pipelineSteps.kubernetesInfraStep.kubernetesConnector')}</Text>
                      </Layout.Horizontal>
                    }
                    variableName="connectorRef"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      formik.setFieldValue('connectorRef', value)
                    }}
                    isReadonly={readonly}
                  />
                )}
              </Layout.Horizontal>
              <Layout.Horizontal spacing="medium" className={css.formRow}>
                <FormInput.MultiTextInput
                  name="namespace"
                  tooltipProps={{
                    dataTooltipId: 'k8InfraNamespace'
                  }}
                  className={css.inputWidth}
                  disabled={readonly}
                  label={getString('common.namespace')}
                  placeholder={getString('pipeline.infraSpecifications.namespacePlaceholder')}
                  multiTextInputProps={{ expressions, textProps: { disabled: readonly }, allowableTypes }}
                />
                {getMultiTypeFromValue(formik.values.namespace) === MultiTypeInputType.RUNTIME && !readonly && (
                  <ConfigureOptions
                    style={{ marginBottom: 12 }}
                    value={formik.values.namespace as string}
                    type="String"
                    variableName="namespace"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      formik.setFieldValue('namespace', value)
                    }}
                    isReadonly={readonly}
                  />
                )}
              </Layout.Horizontal>
              <Accordion
                panelClassName={css.accordionPanel}
                detailsClassName={css.accordionDetails}
                activeId={!isEmpty(formik.errors.releaseName) ? 'advanced' : ''}
              >
                <Accordion.Panel
                  id="advanced"
                  addDomId={true}
                  summary={getString('common.advanced')}
                  details={
                    <Layout.Horizontal spacing="medium" className={css.formRow}>
                      <FormInput.MultiTextInput
                        name="releaseName"
                        tooltipProps={{
                          dataTooltipId: 'k8InfraReleaseName'
                        }}
                        className={css.inputWidth}
                        label={getString('common.releaseName')}
                        disabled={readonly}
                        placeholder={getString('cd.steps.common.releaseNamePlaceholder')}
                        multiTextInputProps={{ expressions, textProps: { disabled: readonly }, allowableTypes }}
                      />
                      {getMultiTypeFromValue(formik.values.releaseName) === MultiTypeInputType.RUNTIME && !readonly && (
                        <ConfigureOptions
                          value={formik.values.releaseName as string}
                          type="String"
                          variableName="releaseName"
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={value => {
                            formik.setFieldValue('releaseName', value)
                          }}
                          isReadonly={readonly}
                        />
                      )}
                    </Layout.Horizontal>
                  }
                />
              </Accordion>

              <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }} className={css.lastRow}>
                <FormInput.CheckBox
                  className={css.simultaneousDeployment}
                  name={'allowSimultaneousDeployments'}
                  label={getString('cd.allowSimultaneousDeployments')}
                  tooltipProps={{
                    dataTooltipId: 'k8InfraAllowSimultaneousDeployments'
                  }}
                  disabled={readonly}
                />
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

const KubernetesInfraSpecInputForm: React.FC<KubernetesInfraSpecEditableProps & { path: string }> = ({
  template,
  readonly = false,
  path,
  allowableTypes
}) => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { expressions } = useVariablesExpression()
  const { getString } = useStrings()
  return (
    <Layout.Vertical className={css.containerPadding} padding="medium" spacing="small">
      {getMultiTypeFromValue(template?.connectorRef) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormMultiTypeConnectorField
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            tooltipProps={{
              dataTooltipId: 'k8sDirectInfraConnector'
            }}
            width={391}
            name={`${path}.connectorRef`}
            label={getString('connector')}
            gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
            placeholder={getString('connectors.selectConnector')}
            disabled={readonly}
            setRefValue
            className={css.connectorMargin}
            multiTypeProps={{ allowableTypes, expressions }}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.namespace) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${path}.namespace`}
            label={getString('common.namespace')}
            disabled={readonly}
            multiTextInputProps={{
              allowableTypes,
              expressions
            }}
            placeholder={getString('pipeline.infraSpecifications.namespacePlaceholder')}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.releaseName) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${path}.releaseName`}
            label={getString('common.releaseName')}
            disabled={readonly}
            multiTextInputProps={{
              allowableTypes,
              expressions
            }}
            placeholder={getString('cd.steps.common.releaseNamePlaceholder')}
          />
        </div>
      )}
    </Layout.Vertical>
  )
}

const KubernetesInfraSpecVariablesForm: React.FC<KubernetesInfraSpecEditableProps> = ({
  metadataMap,
  variablesData,
  initialValues
}) => {
  const infraVariables = variablesData?.infrastructureDefinition?.spec
  return infraVariables ? (
    <VariablesListTable
      data={infraVariables}
      originalData={initialValues?.infrastructureDefinition?.spec || initialValues}
      metadataMap={metadataMap}
      className={pipelineVariableCss.variablePaddingL1}
    />
  ) : null
}

interface K8SDirectInfrastructureStep extends K8SDirectInfrastructure {
  name?: string
  identifier?: string
}
const KubernetesDirectRegex = /^.+stage\.spec\.infrastructure\.infrastructureDefinition\.spec\.connectorRef$/
const KubernetesDirectType = 'KubernetesDirect'
export class KubernetesInfraSpec extends PipelineStep<K8SDirectInfrastructureStep> {
  lastFetched: number
  protected type = StepType.KubernetesDirect
  protected defaultValues: K8SDirectInfrastructure = { connectorRef: '', namespace: '', releaseName: '' }

  protected stepIcon: IconName = 'service-kubernetes'
  protected stepName = 'Specify your Kubernetes Connector'
  protected stepPaletteVisible = false
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    super()
    this.lastFetched = new Date().getTime()
    this.invocationMap.set(KubernetesDirectRegex, this.getConnectorsListForYaml.bind(this))

    this._hasStepVariables = true
  }
  protected getConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj.type === KubernetesDirectType) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: ['K8sCluster', 'Gcp', 'Aws'], filterType: 'Connector' }
        }).then(response => {
          const data =
            response?.data?.content?.map(connector => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })) || []
          return data
        })
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<K8SDirectInfrastructure>): FormikErrors<K8SDirectInfrastructure> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    const errors: Partial<K8SDirectInfrastructureTemplate> = {}
    if (
      isEmpty(data.connectorRef) &&
      isRequired &&
      getMultiTypeFromValue(template?.connectorRef) === MultiTypeInputType.RUNTIME
    ) {
      errors.connectorRef = getString?.('fieldRequired', { field: getString('connector') })
    }
    if (getString && getMultiTypeFromValue(template?.namespace) === MultiTypeInputType.RUNTIME) {
      const namespace = Yup.object().shape({
        namespace: getNameSpaceSchema(getString, isRequired)
      })

      try {
        namespace.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    if (getString && getMultiTypeFromValue(template?.releaseName) === MultiTypeInputType.RUNTIME) {
      const releaseName = Yup.object().shape({
        releaseName: getReleaseNameSchema(getString, isRequired)
      })

      try {
        releaseName.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    return errors
  }

  renderStep(props: StepProps<K8SDirectInfrastructure>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      customStepProps,
      readonly = false,
      allowableTypes
    } = props
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <KubernetesInfraSpecInputForm
          {...(customStepProps as KubernetesInfraSpecEditableProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          readonly={inputSetData?.readonly}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <KubernetesInfraSpecVariablesForm
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          template={inputSetData?.template}
          {...(customStepProps as KubernetesInfraSpecEditableProps)}
          initialValues={initialValues}
        />
      )
    }

    return (
      <KubernetesInfraSpecEditable
        onUpdate={onUpdate}
        readonly={readonly}
        stepViewType={stepViewType}
        {...(customStepProps as KubernetesInfraSpecEditableProps)}
        initialValues={initialValues}
        allowableTypes={allowableTypes}
      />
    )
  }
}
