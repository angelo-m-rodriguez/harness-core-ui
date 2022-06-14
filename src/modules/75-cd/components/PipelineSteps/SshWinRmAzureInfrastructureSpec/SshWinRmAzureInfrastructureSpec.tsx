/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useRef, useContext } from 'react'
import { Layout, FormInput, SelectOption, Formik, FormikForm, IconName } from '@wings-software/uicore'
import type { FormikProps, FormikErrors } from 'formik'
import { useParams } from 'react-router-dom'
import { debounce, noop, get, defaultTo, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { useToaster } from '@common/exports'
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
import type { AzureSubscriptionDTO, AzureTagDTO } from 'services/cd-ng'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { Connectors } from '@connectors/constants'
import { Scope } from '@common/interfaces/SecretsInterface'
import SSHSecretInput from '@secrets/components/SSHSecretInput/SSHSecretInput'
import { setSecretField } from '@secrets/utils/SecretField'
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
  const { showError } = useToaster()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const [subscriptions, setSubscriptions] = useState<SelectOption[]>([])
  const [isSubsLoading, setIsSubsLoading] = useState(false)

  const [resourceGroups, setResourceGroups] = useState<SelectOption[]>([])
  const [isResGroupLoading, setIsResGroupLoading] = useState(false)

  const [clusters, setClusters] = useState<SelectOption[]>([])
  const [isClustersLoading, setIsClustersLoading] = useState(false)

  const [azureTags, setAzureTags] = useState([])
  const [isTagsLoading, setIsTagsLoading] = useState(false)

  const delayedOnUpdate = useRef(debounce(onUpdate || noop, 300)).current
  const { getString } = useStrings()

  const formikRef = useRef<FormikProps<AzureInfrastructureUI> | null>(null)

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
      if (response.status === 'SUCCESS') {
        const subs = get(response, 'data.subscriptions', []).map((sub: AzureSubscriptionDTO) => ({
          label: sub.subscriptionName,
          value: sub.subscriptionId
        }))
        setSubscriptions(subs)
      } else {
        /* istanbul ignore next */
        showError(get(response, 'message', response))
      }
    } catch (e) {
      /* istanbul ignore next */
      showError(e.message || e.responseMessage[0])
    } finally {
      setIsSubsLoading(false)
    }
  }

  const fetchSubscriptionTags = async (connectorRef: string, subscriptionId: string) => {
    setIsTagsLoading(true)
    try {
      const response = await getSubscriptionTagsPromise({
        subscriptionId,
        queryParams: {
          connectorRef,
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier
        }
      })
      if (response.status === 'SUCCESS') {
        setAzureTags(
          get(response, 'data.tags', []).map((azureTag: AzureTagDTO) => ({ label: azureTag.tag, value: azureTag.tag }))
        )
      } else {
        /* istanbul ignore next */
        showError(get(response, 'message', response))
      }
    } catch (e) {
      /* istanbul ignore next */
      showError(e.message || e.errorMessage)
    } finally {
      setIsTagsLoading(false)
    }
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
      if (response.status === 'SUCCESS') {
        setResourceGroups(
          (response.data?.resourceGroups || []).map(rg => ({ label: rg.resourceGroup, value: rg.resourceGroup }))
        )
      } else {
        /* istanbul ignore next */
        showError(get(response, 'message', response))
      }
    } catch (e) {
      /* istanbul ignore next */
      showError(e.message || e.errorMessage)
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
      if (response.status === 'SUCCESS') {
        const clusterOptions = get(response, 'data.clusters', []).map((cl: { cluster: string }) => ({
          label: cl.cluster,
          value: cl.cluster
        }))
        setClusters(clusterOptions)
      } else {
        /* istanbul ignore next */
        showError(get(response, 'message', response))
      }
    } catch (e) {
      /* istanbul ignore next */
      showError(e.message || e.responseMessage[0])
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
    if (initialValues.credentialsRef) {
      ;(async () => {
        try {
          const secretData = await setSecretField(initialValues.credentialsRef, {
            accountIdentifier: accountId,
            projectIdentifier,
            orgIdentifier
          })
          formikRef?.current?.setFieldValue('sshKey', secretData)
        } catch (e) {
          /* istanbul ignore next */
          showError(e.data?.message || e.message)
        }
      })()
    }
  }, [])

  const getInitialValues = (): AzureInfrastructureUI => {
    const currentValues: AzureInfrastructureUI = {
      ...initialValues,
      tags: Object.values(initialValues.tags || {})
    }
    currentValues.subscriptionId = initialValues.subscriptionId
      ? { label: initialValues.subscriptionId, value: initialValues.subscriptionId }
      : ''
    currentValues.cluster = initialValues.cluster ? { label: initialValues.cluster, value: initialValues.cluster } : ''
    currentValues.resourceGroup = initialValues.resourceGroup
      ? { label: initialValues.resourceGroup, value: initialValues.resourceGroup }
      : ''
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

  const clearClusters = () => {
    formikRef.current?.setFieldValue('cluster', '')
    setClusters([])
  }

  const clearTags = () => {
    formikRef.current?.setFieldValue('tags', [])
    setAzureTags([])
  }

  const clearResourceGroup = () => {
    formikRef.current?.setFieldValue('resourceGroup', '')
    setResourceGroups([])
    clearClusters()
    clearTags()
  }

  const clearSubscriptionId = () => {
    formikRef.current?.setFieldValue('subscriptionId', '')
    setSubscriptions([])
    clearResourceGroup()
  }

  return (
    <Layout.Vertical spacing="medium">
      <Formik<AzureInfrastructureUI>
        formName="sshWinRmAzureInfra"
        initialValues={getInitialValues()}
        validate={value => {
          const data: Partial<SshWinRmAzureInfrastructure> = {
            connectorRef: getValue(value.connectorRef) || value.connectorRef,
            subscriptionId:
              getValue(value.subscriptionId) === ''
                ? /* istanbul ignore next */ undefined
                : getValue(value.subscriptionId),
            resourceGroup:
              getValue(value.resourceGroup) === ''
                ? /* istanbul ignore next */ undefined
                : getValue(value.resourceGroup),
            cluster: getValue(value.cluster) === '' ? /* istanbul ignore next */ undefined : getValue(value.cluster),
            tags: value.tags.reduce(
              (obj: object, tag: AzureTagDTO) => ({
                ...obj,
                [tag.tag]: tag.tag
              }),
              {}
            ),
            usePublicDns: value.usePublicDns
          }
          if (value.sshKey) {
            const prefix = value.sshKey.projectIdentifier ? '' : value.sshKey.projectIdentifier ? 'org.' : 'account.'
            data.credentialsRef = `${prefix}${value.sshKey.identifier}`
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
              <Layout.Vertical spacing="medium">
                <Layout.Vertical className={css.inputWidth}>
                  <SSHSecretInput name={'sshKey'} label={getString('cd.steps.common.specifyCredentials')} />
                </Layout.Vertical>
                <ConnectorReferenceField
                  name="connectorRef"
                  label={getString('connector')}
                  placeholder={getString('connectors.selectConnector')}
                  disabled={readonly}
                  accountIdentifier={accountId}
                  projectIdentifier={projectIdentifier}
                  orgIdentifier={orgIdentifier}
                  className={css.inputWidth}
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
                      clearSubscriptionId()
                      fetchSubscriptions(connectorValue)
                    }
                  }}
                  gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                />
                <FormInput.Select
                  name="subscriptionId"
                  className={`subscriptionId-select ${css.inputWidth}`}
                  items={subscriptions}
                  disabled={isSubsLoading || !formik.values.connectorRef || readonly}
                  placeholder={
                    isSubsLoading ? getString('loading') : getString('cd.steps.azureInfraStep.subscriptionPlaceholder')
                  }
                  label={getString(subscriptionLabel)}
                  onChange={
                    /* istanbul ignore next */ value => {
                      if (value) {
                        clearResourceGroup()
                        const connectorRefIdentifier = getValue(formik.values?.connectorRef)
                        const subsId = getValue(value)
                        fetchResourceGroups(connectorRefIdentifier, subsId)
                        fetchSubscriptionTags(connectorRefIdentifier, subsId)
                      }
                    }
                  }
                />
                <FormInput.Select
                  name="resourceGroup"
                  className={`resourceGroup-select ${css.inputWidth}`}
                  items={resourceGroups}
                  disabled={isResGroupLoading || !formik.values.subscriptionId || readonly}
                  placeholder={getString('cd.steps.azureInfraStep.resourceGroupPlaceholder')}
                  onChange={value => {
                    if (value) {
                      clearClusters()
                      fetchAzureClusters(
                        getValue(formik.values?.connectorRef),
                        getValue(formik.values?.subscriptionId),
                        getValue(value)
                      )
                    }
                  }}
                  label={getString(resourceGroupLabel)}
                />
                <FormInput.Select
                  name="cluster"
                  className={`cluster-select ${css.inputWidth}`}
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
                <FormInput.MultiSelect
                  name="tags"
                  label={getString('tagLabel')}
                  items={azureTags}
                  disabled={isTagsLoading || !formik.values.subscriptionId || readonly}
                  className={css.inputWidth}
                />
                <FormInput.CheckBox
                  className={css.simultaneousDeployment}
                  tooltipProps={{
                    dataTooltipId: 'sshWinrmAzureUsePublicDns'
                  }}
                  name={'usePublicDns'}
                  label={getString('cd.infrastructure.sshWinRmAzure.usePublicDns')}
                  disabled={readonly}
                />
              </Layout.Vertical>
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

export const AzureConnectorRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.connectorRef$/
export const AzureSubscriptionRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.subscriptionId$/
export const AzureResourceGroupRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.resourceGroup$/
export const AzureClusterRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.cluster$/
export const SshWinRmAzureType = StepType.SshWinRmAzure

export class SshWinRmAzureInfrastructureSpec extends PipelineStep<AzureInfrastructureSpecStep> {
  lastFetched: number
  protected type = StepType.SshWinRmAzure
  protected defaultValues: SshWinRmAzureInfrastructure = {
    credentialsRef: '',
    connectorRef: '',
    subscriptionId: '',
    resourceGroup: '',
    cluster: '',
    tags: {},
    usePublicDns: false
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
    if (isEmpty(data.sshKey)) {
      errors.credentialsRef = getString?.('common.validation.fieldIsRequired', { name: getString('connector') })
    }
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
