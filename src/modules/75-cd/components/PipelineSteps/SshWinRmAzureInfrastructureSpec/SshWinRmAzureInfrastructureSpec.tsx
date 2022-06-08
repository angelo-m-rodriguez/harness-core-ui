/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useRef, useContext } from 'react'
import { Layout, FormInput, SelectOption, Formik, FormikForm, IconName, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { FormikProps, FormikErrors } from 'formik'
import { useParams } from 'react-router-dom'
import { debounce, noop, get, defaultTo, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import {
  getAzureClustersPromise,
  getAzureResourceGroupsBySubscriptionPromise,
  getAzureSubscriptionsPromise,
  getConnectorListV2Promise,
  SshWinRmAzureInfrastructure,
  getSubscriptionTagsPromise
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

  const [subscriptions, setSubscriptions] = useState<SelectOption[]>([])
  const [isSubsLoading, setIsSubsLoading] = useState(false)
  const [subsErrorMessage, setSubsErrorMessage] = useState('')

  const [resourceGroups, setResourceGroups] = useState<SelectOption[]>([])
  const [isResGroupLoading, setIsResGroupLoading] = useState(false)
  const [resGroupErrorMessage, setResGroupErrorMessage] = useState('')

  const [clusters, setClusters] = useState<SelectOption[]>([])
  const [isClustersLoading, setIsClustersLoading] = useState(false)
  const [clustersErrorMessage, setClustersErrorMessage] = useState('')

  const [azureTags, setAzureTags] = useState([])

  const delayedOnUpdate = useRef(debounce(onUpdate || noop, 300)).current
  const { getString } = useStrings()

  const formikRef = useRef<FormikProps<AzureInfrastructureUI> | null>(null)

  useEffect(() => {
    formikRef?.current?.setFieldValue('subscriptionId', getSubscription(initialValues))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions])

  const fetchSubscriptions = async (connectorRef: string) => {
    setIsSubsLoading(true)
    try {
      const response = await getAzureSubscriptionsPromise({
        queryParams: {
          connectorRef: connectorRef,
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier
        }
      })
      const subs = get(response, 'data.subscriptions', []).map(sub => ({
        label: `${sub.subscriptionName}: ${sub.subscriptionId}`,
        value: sub.subscriptionId
      }))
      setSubscriptions(subs)
    } catch (e) {
      setSubsErrorMessage(e.message || e.responseMessage[0])
    } finally {
      setIsSubsLoading(false)
    }
  }

  const fetchSubscriptionTags = async (connectorRef: string, subscriptionId: string) => {
    const response = await getSubscriptionTagsPromise({
      subscriptionId,
      queryParams: {
        connectorRef,
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      }
    })
    console.log('getSubscriptionTagsPromise response: ', response)
    setAzureTags(response.data?.tags || [])
  }

  const fetchResourceGroups = async (connectorRef: string, subscriptionId: string) => {
    setIsResGroupLoading(true)
    try {
      const response = await getAzureResourceGroupsBySubscriptionPromise({
        queryParams: {
          connectorRef: connectorRef,
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier
        },
        subscriptionId: subscriptionId
      })
      setResourceGroups(
        (response.data?.resourceGroups || []).map(rg => ({ label: rg.resourceGroup, value: rg.resourceGroup }))
      )
    } catch (e) {
      setResGroupErrorMessage(e.message || e.responseMessage[0])
    } finally {
      setIsResGroupLoading(false)
    }
  }

  const fetchAzureClusters = async (connectorRef: string, subscriptionId: string, resourceGroup: string) => {
    setIsClustersLoading(true)
    try {
      const response = await getAzureClustersPromise({
        queryParams: {
          connectorRef: connectorRef,
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier
        },
        subscriptionId: subscriptionId,
        resourceGroup: resourceGroup
      })
      const clusterOptions = get(response, 'data.clusters', []).map(cl => ({ label: cl.cluster, value: cl.cluster }))
      setClusters(clusterOptions)
    } catch (e) {
      setClustersErrorMessage(e.message || e.responseMessage[0])
    } finally {
      setIsClustersLoading(false)
    }
  }

  useEffect(() => {
    if (initialValues.connectorRef) {
      const { connectorRef } = initialValues
      fetchSubscriptions(connectorRef)
      if (initialValues.subscriptionId) {
        const { subscriptionId } = initialValues
        fetchResourceGroups(connectorRef, subscriptionId)
        fetchSubscriptionTags(connectorRef, subscriptionId)
        if (initialValues.resourceGroup) {
          const { resourceGroup } = initialValues
          fetchAzureClusters(connectorRef, subscriptionId, resourceGroup)
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
      ...initialValues,
      tags: Object(initialValues.tags || {}).values
    }
    /* istanbul ignore else */
    if (initialValues) {
      currentValues.subscriptionId = getSubscription(initialValues)
      currentValues.cluster = { label: initialValues.cluster, value: initialValues.cluster }
      currentValues.resourceGroup = { label: initialValues.resourceGroup, value: initialValues.resourceGroup }
    }
    return currentValues
  }

  const { subscribeForm, unSubscribeForm } = useContext(StageErrorContext)

  useEffect(() => {
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
                  onChange={(value, scope) => {
                    if (value?.identifier) {
                      const connectorValue = `${scope !== Scope.PROJECT ? `${scope}.` : ''}${value.identifier}`
                      formik.setFieldValue('connectorRef', {
                        label: value.name || '',
                        value: connectorValue,
                        scope: scope,
                        live: value?.status?.status === 'SUCCESS',
                        connector: value
                      })
                      formik.setFieldValue('subscriptionId', '')
                      formik.setFieldValue('resourceGroup', '')
                      formik.setFieldValue('cluster', '')
                      setSubscriptions([])
                      setResourceGroups([])
                      setClusters([])
                      fetchSubscriptions(connectorValue)
                    }
                  }}
                  gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                />
              </Layout.Horizontal>
              <Layout.Vertical className={css.formRow} spacing="medium">
                <FormInput.Select
                  name="subscriptionId"
                  className={css.inputWidth}
                  items={subscriptions}
                  disabled={isSubsLoading || readonly}
                  placeholder={
                    isSubsLoading ? getString('loading') : getString('cd.steps.azureInfraStep.subscriptionPlaceholder')
                  }
                  label={getString(subscriptionLabel)}
                  onChange={
                    /* istanbul ignore next */ value => {
                      if (value) {
                        fetchResourceGroups(formik.values?.connectorRef?.value, getValue(value))
                        formik.setFieldValue('resourceGroup', '')
                        formik.setFieldValue('cluster', '')
                        setResourceGroups([])
                        setClusters([])
                      }
                    }
                  }
                />
                {subsErrorMessage && <Text color={Color.RED_400}>{subsErrorMessage}</Text>}
              </Layout.Vertical>
              <Layout.Vertical className={css.formRow} spacing="medium">
                <FormInput.Select
                  name="resourceGroup"
                  className={css.inputWidth}
                  items={resourceGroups}
                  disabled={isResGroupLoading || !formik.values.resourceGroup || readonly}
                  placeholder={getString('cd.steps.azureInfraStep.resourceGroupPlaceholder')}
                  onChange={value => {
                    if (value) {
                      formik.setFieldValue('cluster', '')
                      setClusters([])
                      fetchAzureClusters(
                        getValue(formik.values?.connectorRef),
                        getValue(formik.values?.subscriptionId),
                        getValue(value)
                      )
                    }
                  }}
                  label={getString(resourceGroupLabel)}
                />
                {resGroupErrorMessage && <Text color={Color.RED_400}>{resGroupErrorMessage}</Text>}
              </Layout.Vertical>
              <Layout.Vertical className={css.formRow} spacing="medium">
                <FormInput.Select
                  name="cluster"
                  className={css.inputWidth}
                  items={clusters}
                  disabled={isClustersLoading || !formik.values.resourceGroup || readonly}
                  label={getString(clusterLabel)}
                  placeholder={
                    isClustersLoading
                      ? getString('loading')
                      : getString('cd.steps.common.selectOrEnterClusterPlaceholder')
                  }
                  onChange={value => {
                    formik.setFieldValue('cluster', value)
                  }}
                />
                {clustersErrorMessage && <Text color={Color.RED_400}>{clustersErrorMessage}</Text>}
              </Layout.Vertical>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormInput.MultiSelect name="tags" label={getString('tagLabel')} items={azureTags} />
              </Layout.Horizontal>
              <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }} className={css.lastRow}>
                <FormInput.CheckBox
                  className={css.simultaneousDeployment}
                  tooltipProps={{
                    dataTooltipId: 'sshWinrmAzureUsePublicDns'
                  }}
                  name={'usePublicDns'}
                  label={getString('cd.infrastructure.sshWinRmAzure.usePublicDns')}
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
      if (obj?.type === SshWinRmAzureType && obj?.spec?.connectorRef) {
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
      if (obj?.type === SshWinRmAzureType && obj?.spec?.connectorRef && obj?.spec?.subscriptionId) {
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
        obj?.spec?.subscriptionId &&
        obj?.spec?.resourceGroup
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
    getString
  }: ValidateInputSetProps<SshWinRmAzureInfrastructure>): FormikErrors<SshWinRmAzureInfrastructure> {
    const errors: Partial<SshWinRmAzureInfrastructureTemplate> = {}
    if (isEmpty(data.connectorRef)) {
      errors.connectorRef = getString?.('common.validation.fieldIsRequired', { name: getString('connector') })
    }
    if (isEmpty(data.subscriptionId)) {
      errors.subscriptionId = getString?.('common.validation.fieldIsRequired', { name: getString(subscriptionLabel) })
    }
    if (isEmpty(data.resourceGroup)) {
      errors.resourceGroup = getString?.('common.validation.fieldIsRequired', { name: getString(resourceGroupLabel) })
    }
    if (isEmpty(data.cluster)) {
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
