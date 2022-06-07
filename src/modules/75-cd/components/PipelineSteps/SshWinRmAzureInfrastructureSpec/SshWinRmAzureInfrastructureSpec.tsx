/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import {
  Layout,
  FormInput,
  SelectOption,
  Formik,
  FormikForm,
  IconName,
  getMultiTypeFromValue,
  MultiTypeInputType
} from '@wings-software/uicore'
import type { FormikProps, FormikErrors } from 'formik'
import { useParams } from 'react-router-dom'
import { debounce, noop, get, defaultTo, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import {
  getAzureClustersPromise,
  getAzureResourceGroupsBySubscriptionPromise,
  getAzureSubscriptionsPromise,
  getConnectorListV2Promise,
  SshWinRmAzureInfrastructure,
  useGetAzureClusters,
  useGetAzureResourceGroupsBySubscription,
  useGetAzureSubscriptions
} from 'services/cd-ng'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { Connectors } from '@connectors/constants'
import { Scope } from '@common/interfaces/SecretsInterface'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getConnectorName, getConnectorValue } from '@pipeline/components/PipelineSteps/Steps/StepsHelper'
import { ConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import { useStrings } from 'framework/strings'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import {
  AzureInfrastructureSpecEditableProps,
  SshWinRmAzureInfrastructureTemplate,
  getValue,
  getValidationSchema,
  subscriptionLabel,
  clusterLabel,
  resourceGroupLabel
} from './SshWinRmAzureInfrastructureInterface'
import css from './SshWinRmAzureInfrastructureSpec.module.scss'

const logger = loggerFor(ModuleName.CD)

const yamlErrorMessage = 'cd.parsingYamlError'

interface AzureInfrastructureUI
  extends Omit<SshWinRmAzureInfrastructure, 'subscriptionId' | 'cluster' | 'resourceGroup'> {
  subscriptionId?: any
  cluster?: any
  resourceGroup?: any
}

const AzureInfrastructureSpecEditable: React.FC<AzureInfrastructureSpecEditableProps> = ({
  initialValues,
  onUpdate,
  readonly
}): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [subscriptions, setSubscriptions] = React.useState<SelectOption[]>([])
  const [clusters, setClusters] = React.useState<SelectOption[]>([])
  const [resourceGroups, setResourceGroups] = React.useState<SelectOption[]>([])
  const delayedOnUpdate = React.useRef(debounce(onUpdate || noop, 300)).current
  const { getString } = useStrings()

  const formikRef = React.useRef<FormikProps<AzureInfrastructureUI> | null>(null)

  const {
    data: subscriptionsData,
    loading: loadingSubscriptions,
    refetch: refetchSubscriptions
  } = useGetAzureSubscriptions({
    queryParams: {
      connectorRef: initialValues?.connectorRef,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true,
    debounce: 300
  })

  useEffect(() => {
    const subscriptionValues = [] as SelectOption[]
    defaultTo(subscriptionsData?.data?.subscriptions, []).map(sub =>
      subscriptionValues.push({ label: `${sub.subscriptionName}: ${sub.subscriptionId}`, value: sub.subscriptionId })
    )
    setSubscriptions(subscriptionValues as SelectOption[])
  }, [subscriptionsData])

  useEffect(() => {
    formikRef?.current?.setFieldValue('subscriptionId', getSubscription(initialValues))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions])

  const {
    data: resourceGroupData,
    refetch: refetchResourceGroups,
    loading: loadingResourceGroups
  } = useGetAzureResourceGroupsBySubscription({
    queryParams: {
      connectorRef: initialValues?.connectorRef,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    subscriptionId: initialValues?.subscriptionId,
    lazy: true,
    debounce: 300
  })

  React.useEffect(() => {
    const options =
      resourceGroupData?.data?.resourceGroups?.map(rg => ({ label: rg.resourceGroup, value: rg.resourceGroup })) ||
      /* istanbul ignore next */ []
    setResourceGroups(options)
  }, [resourceGroupData])

  const {
    data: clustersData,
    refetch: refetchClusters,
    loading: loadingClusters
  } = useGetAzureClusters({
    queryParams: {
      connectorRef: initialValues?.connectorRef,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    subscriptionId: initialValues?.subscriptionId,
    resourceGroup: initialValues?.resourceGroup,
    lazy: true,
    debounce: 300
  })

  React.useEffect(() => {
    const options =
      clustersData?.data?.clusters?.map(cl => ({ label: cl.cluster, value: cl.cluster })) ||
      /* istanbul ignore next */ []
    setClusters(options)
  }, [clustersData])

  useEffect(() => {
    if (initialValues.connectorRef) {
      refetchSubscriptions({
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          connectorRef: initialValues.connectorRef
        }
      })
      if (initialValues.subscriptionId) {
        refetchResourceGroups({
          queryParams: {
            accountIdentifier: accountId,
            projectIdentifier,
            orgIdentifier,
            connectorRef: initialValues.connectorRef
          },
          pathParams: {
            subscriptionId: initialValues.subscriptionId
          }
        })
        if (initialValues.resourceGroup) {
          refetchClusters({
            queryParams: {
              connectorRef: initialValues?.connectorRef,
              accountIdentifier: accountId,
              orgIdentifier,
              projectIdentifier
            },
            pathParams: {
              subscriptionId: initialValues?.subscriptionId,
              resourceGroup: initialValues?.resourceGroup
            }
          })
        }
      }
    }
  }, [])

  const getSubscription = (values: AzureInfrastructureUI): SelectOption | undefined => {
    const value = values.subscriptionId ? values.subscriptionId : formikRef?.current?.values?.subscriptionId?.value
    return (
      subscriptions.find(subscription => subscription.value === value) || {
        label: value,
        value: value
      }
    )
  }

  const getInitialValues = (): AzureInfrastructureUI => {
    const currentValues: AzureInfrastructureUI = {
      ...initialValues
    }
    /* istanbul ignore else */
    if (initialValues) {
      currentValues.subscriptionId = getSubscription(initialValues)
      currentValues.cluster = { label: initialValues.cluster, value: initialValues.cluster }
      currentValues.resourceGroup = { label: initialValues.resourceGroup, value: initialValues.resourceGroup }
    }
    return currentValues
  }

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  React.useEffect(() => {
    subscribeForm({
      tab: DeployTabs.INFRASTRUCTURE,
      form: formikRef as React.MutableRefObject<FormikProps<unknown> | null>
    })
    return () =>
      unSubscribeForm({
        tab: DeployTabs.INFRASTRUCTURE,
        form: formikRef as React.MutableRefObject<FormikProps<unknown> | null>
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Layout.Vertical spacing="medium">
      <Formik<AzureInfrastructureUI>
        formName="sshWinRmAzureInfra"
        initialValues={getInitialValues()}
        validate={value => {
          const data: Partial<SshWinRmAzureInfrastructure> = {
            connectorRef: undefined,
            subscriptionId:
              getValue(value.subscriptionId) === ''
                ? /* istanbul ignore next */ undefined
                : getValue(value.subscriptionId),
            resourceGroup:
              getValue(value.resourceGroup) === ''
                ? /* istanbul ignore next */ undefined
                : getValue(value.resourceGroup),
            cluster: getValue(value.cluster) === '' ? /* istanbul ignore next */ undefined : getValue(value.cluster),
            allowSimultaneousDeployments: value.allowSimultaneousDeployments
          }
          /* istanbul ignore else */ if (value.connectorRef) {
            data.connectorRef = value.connectorRef?.value || /* istanbul ignore next */ value.connectorRef
          }

          delayedOnUpdate(data)
        }}
        validationSchema={getValidationSchema(getString)}
        onSubmit={noop}
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.INFRASTRUCTURE }))
          formikRef.current = formik
          return (
            <FormikForm>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <ConnectorReferenceField
                  name="connectorRef"
                  label={getString('connector')}
                  placeholder={getString('connectors.selectConnector')}
                  disabled={readonly}
                  accountIdentifier={accountId}
                  projectIdentifier={projectIdentifier}
                  orgIdentifier={orgIdentifier}
                  width={450}
                  style={{ marginBottom: 'var(--spacing-large)' }}
                  type={Connectors.AZURE}
                  selected={formik.values.connectorRef}
                  onChange={
                    /* istanbul ignore next */ async (value: any, scope = Scope.PROJECT) => {
                      /* istanbul ignore next */
                      if (value?.identifier) {
                        const connectorValue = `${scope !== Scope.PROJECT ? `${scope}.` : ''}${value.identifier}`
                        formik.setFieldValue('connectorRef', {
                          label: value.name || '',
                          value: connectorValue,
                          scope: scope,
                          live: value?.status?.status === 'SUCCESS',
                          connector: value
                        })
                        setSubscriptions([])
                        setResourceGroups([])
                        setClusters([])
                        formik.setFieldValue('subscriptionId', '')
                        formik.setFieldValue('resourceGroup', '')
                        formik.setFieldValue('cluster', '')
                        await refetchSubscriptions({
                          queryParams: {
                            accountIdentifier: accountId,
                            projectIdentifier,
                            orgIdentifier,
                            connectorRef: connectorValue
                          }
                        })
                      }
                    }
                  }
                  gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                />
              </Layout.Horizontal>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormInput.Select
                  name="subscriptionId"
                  className={css.inputWidth}
                  items={subscriptions}
                  disabled={loadingSubscriptions || readonly}
                  placeholder={
                    loadingSubscriptions
                      ? /* istanbul ignore next */ getString('loading')
                      : getString('cd.steps.azureInfraStep.subscriptionPlaceholder')
                  }
                  label={getString(subscriptionLabel)}
                  onChange={
                    /* istanbul ignore next */ value => {
                      if (value) {
                        refetchResourceGroups({
                          queryParams: {
                            accountIdentifier: accountId,
                            projectIdentifier,
                            orgIdentifier,
                            connectorRef: getValue(formik.values?.connectorRef)
                          },
                          pathParams: {
                            subscriptionId: getValue(value)
                          }
                        })
                        formik.setFieldValue('resourceGroup', '')
                        formik.setFieldValue('cluster', '')
                        setResourceGroups([])
                        setClusters([])
                      }
                    }
                  }
                />
              </Layout.Horizontal>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormInput.Select
                  name="resourceGroup"
                  className={css.inputWidth}
                  items={resourceGroups}
                  disabled={loadingResourceGroups || readonly}
                  placeholder={
                    loadingResourceGroups
                      ? /* istanbul ignore next */ getString('loading')
                      : getString('cd.steps.azureInfraStep.resourceGroupPlaceholder')
                  }
                  onChange={
                    /* istanbul ignore next */ value => {
                      if (value) {
                        formik.setFieldValue('cluster', '')
                        setClusters([])
                        console.log('onChange refetchClusters')
                        refetchClusters({
                          queryParams: {
                            accountIdentifier: accountId,
                            projectIdentifier,
                            orgIdentifier,
                            connectorRef: getValue(formik.values?.connectorRef)
                          },
                          pathParams: {
                            subscriptionId: getValue(formik.values?.subscriptionId),
                            resourceGroup: getValue(value)
                          }
                        })
                      }
                    }
                  }
                  label={getString(resourceGroupLabel)}
                />
              </Layout.Horizontal>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormInput.Select
                  name="cluster"
                  className={css.inputWidth}
                  items={clusters}
                  disabled={loadingClusters || readonly}
                  label={getString(clusterLabel)}
                  placeholder={
                    loadingClusters
                      ? /* istanbul ignore next */ getString('loading')
                      : getString('cd.steps.common.selectOrEnterClusterPlaceholder')
                  }
                  onChange={value => {
                    /* istanbul ignore next */
                    formik.setFieldValue('cluster', value)
                  }}
                />
              </Layout.Horizontal>
              <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }} className={css.lastRow}>
                <FormInput.CheckBox
                  className={css.simultaneousDeployment}
                  tooltipProps={{
                    dataTooltipId: 'azureAllowSimultaneousDeployments'
                  }}
                  name={'allowSimultaneousDeployments'}
                  label={getString('cd.allowSimultaneousDeployments')}
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

interface AzureInfrastructureSpecStep extends SshWinRmAzureInfrastructure {
  name?: string
  identifier?: string
}

const AzureConnectorRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.connectorRef$/
const AzureSubscriptionRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.subscriptionId$/
const AzureResourceGroupRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.resourceGroup$/
const AzureClusterRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.cluster$/
const SshWinRmAzureType = StepType.SshWinRmAzure

export class SshWinRmAzureInfrastructureSpec extends PipelineStep<AzureInfrastructureSpecStep> {
  lastFetched: number
  protected type = StepType.SshWinRmAzure
  protected defaultValues: SshWinRmAzureInfrastructure = {
    connectorRef: '',
    credentialsRef: '',
    subscriptionId: '',
    cluster: '',
    resourceGroup: '',
    tags: {}
  }

  protected stepIcon: IconName = 'microsoft-azure'
  protected stepName = 'Specify your Azure Connector'
  protected stepPaletteVisible = false
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    super()
    this.lastFetched = new Date().getTime()
    this.invocationMap.set(AzureConnectorRegex, this.getConnectorsListForYaml.bind(this))
    this.invocationMap.set(AzureSubscriptionRegex, this.getSubscriptionListForYaml.bind(this))
    this.invocationMap.set(AzureResourceGroupRegex, this.getClusterListForYaml.bind(this))
    this.invocationMap.set(AzureClusterRegex, this.getClusterListForYaml.bind(this))

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
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj?.type === SshWinRmAzureType) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: [Connectors.AZURE], filterType: 'Connector' }
        }).then(
          response =>
            response?.data?.content?.map(connector => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  protected getSubscriptionListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.subscriptionId', ''))
      if (
        obj?.type === SshWinRmAzureType &&
        obj?.spec?.connectorRef &&
        getMultiTypeFromValue(obj.spec?.connectorRef) === MultiTypeInputType.FIXED
      ) {
        return getAzureSubscriptionsPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: obj.spec?.connectorRef
          }
        }).then(response => {
          const values: CompletionItemInterface[] = []
          defaultTo(response?.data?.subscriptions, []).map(sub =>
            values.push({ label: sub.subscriptionId, insertText: sub.subscriptionId, kind: CompletionItemKind.Field })
          )
          return values
        })
      }
    }

    return Promise.resolve([])
  }

  protected getResourceGroupListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    // /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.resourceGroup', ''))
      if (
        obj?.type === SshWinRmAzureType &&
        obj?.spec?.connectorRef &&
        getMultiTypeFromValue(obj.spec?.connectorRef) === MultiTypeInputType.FIXED &&
        obj?.spec?.subscriptionId &&
        getMultiTypeFromValue(obj.spec?.subscriptionId) === MultiTypeInputType.FIXED
      ) {
        return getAzureResourceGroupsBySubscriptionPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: obj.spec?.connectorRef
          },
          subscriptionId: obj.spec?.subscriptionId
        }).then(
          response =>
            response?.data?.resourceGroups?.map(rg => ({
              label: rg.resourceGroup,
              insertText: rg.resourceGroup,
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  protected getClusterListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    // /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.cluster', ''))
      if (
        obj?.type === SshWinRmAzureType &&
        obj?.spec?.connectorRef &&
        getMultiTypeFromValue(obj.spec?.connectorRef) === MultiTypeInputType.FIXED &&
        obj?.spec?.subscriptionId &&
        getMultiTypeFromValue(obj.spec?.subscriptionId) === MultiTypeInputType.FIXED &&
        obj?.spec?.resourceGroup &&
        getMultiTypeFromValue(obj.spec?.resourceGroup) === MultiTypeInputType.FIXED
      ) {
        return getAzureClustersPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: obj.spec?.connectorRef
          },
          subscriptionId: obj.spec?.subscriptionId,
          resourceGroup: obj.spec?.resourceGroup
        }).then(
          response =>
            response?.data?.clusters?.map(cl => ({
              label: cl.cluster,
              insertText: cl.cluster,
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<SshWinRmAzureInfrastructure>): FormikErrors<SshWinRmAzureInfrastructure> {
    const errors: Partial<SshWinRmAzureInfrastructureTemplate> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (
      isEmpty(data.connectorRef) &&
      isRequired &&
      getMultiTypeFromValue(template?.connectorRef) === MultiTypeInputType.RUNTIME
    ) {
      errors.connectorRef = getString?.('common.validation.fieldIsRequired', { name: getString('connector') })
    }
    if (
      isEmpty(data.subscriptionId) &&
      isRequired &&
      getMultiTypeFromValue(template?.subscriptionId) === MultiTypeInputType.RUNTIME
    ) {
      errors.subscriptionId = getString?.('common.validation.fieldIsRequired', { name: getString(subscriptionLabel) })
    }
    if (
      isEmpty(data.resourceGroup) &&
      isRequired &&
      getMultiTypeFromValue(template?.resourceGroup) === MultiTypeInputType.RUNTIME
    ) {
      errors.resourceGroup = getString?.('common.validation.fieldIsRequired', { name: getString(resourceGroupLabel) })
    }
    if (
      isEmpty(data.cluster) &&
      isRequired &&
      getMultiTypeFromValue(template?.cluster) === MultiTypeInputType.RUNTIME
    ) {
      errors.cluster = getString?.('common.validation.fieldIsRequired', { name: getString(clusterLabel) })
    }
    return errors
  }

  renderStep(props: StepProps<SshWinRmAzureInfrastructure>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, customStepProps, readonly, allowableTypes } = props
    return (
      <AzureInfrastructureSpecEditable
        onUpdate={onUpdate}
        readonly={readonly}
        stepViewType={stepViewType}
        {...(customStepProps as AzureInfrastructureSpecEditableProps)}
        initialValues={initialValues}
        allowableTypes={allowableTypes}
      />
    )
  }
}
