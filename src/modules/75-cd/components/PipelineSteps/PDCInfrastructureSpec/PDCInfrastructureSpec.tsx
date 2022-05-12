/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo, useEffect } from 'react'
import {
  IconName,
  Layout,
  Formik,
  FormikForm,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Select
} from '@wings-software/uicore'
import { Radio, RadioGroup } from '@blueprintjs/core'
import { parse } from 'yaml'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import { debounce, noop, isEmpty, set, get } from 'lodash-es'
import type { FormikErrors, FormikProps } from 'formik'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { PdcInfrastructure, getConnectorListV2Promise, listSecretsV2Promise } from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { useToaster } from '@common/exports'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { Scope } from '@common/interfaces/SecretsInterface'
import { SecretReferenceInterface, setSecretField } from '@secrets/utils/SecretField'
import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { getConnectorName, getConnectorValue } from '@pipeline/components/PipelineSteps/Steps/StepsHelper'
import { ConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import DelegateSelectorPanel from '@pipeline/components/PipelineSteps/AdvancedSteps/DelegateSelectorPanel/DelegateSelectorPanel'
import SSHSecretInput from '@secrets/components/SSHSecretInput/SSHSecretInput'
import PreviewHostsTable from './PreviewHostsTable/PreviewHostsTable'
import css from './PDCInfrastructureSpec.module.scss'

const logger = loggerFor(ModuleName.CD)

type PdcInfrastructureTemplate = { [key in keyof PdcInfrastructure]: string }

const PdcType = 'Pdc'

function getValidationSchema(getString: UseStringsReturn['getString']): Yup.ObjectSchema {
  return Yup.object().shape({
    sshKey: Yup.object().required(getString('validation.password'))
  })
}
interface GcpInfrastructureSpecEditableProps {
  initialValues: PdcInfrastructure
  allValues?: PdcInfrastructure
  onUpdate?: (data: PdcInfrastructure) => void
  stepViewType?: StepViewType
  readonly?: boolean
  template?: PdcInfrastructureTemplate
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: PdcInfrastructure
  allowableTypes: MultiTypeInputType[]
}

interface PDCInfrastructureUI {
  hostsType: number
  allowSimultaneousDeployments: boolean
  attributeFilters?: string
  hosts: string
  connectorRef?: string
  delegateSelectors?: string[] | undefined
  hostFilters: string
  sshKey: SecretReferenceInterface | void
}

const PreconfiguredHosts = {
  TRUE: 'true',
  FALSE: 'false'
}

const HostScope = {
  ALL: 'allHosts',
  SPECIFIC: 'specificHosts'
}

const SpecificHostOption = {
  HOST_NAME: 'hostName',
  ATTRIBUTES: 'attributes'
}

const parseByComma = (data: string) =>
  data
    ?.replace(/,/g, '\n')
    .split('\n')
    .filter(part => part.length)
    .map(part => part.trim()) || []

const parseHosts = (hosts: string) => parseByComma(hosts)

const parseAttributes = (attributes: string) =>
  parseByComma(attributes).reduce((prev, current) => {
    const [key, value] = current.split(':')
    if (key && value) {
      set(prev, key, value)
    }
    return prev
  }, {}) || {}

const GcpInfrastructureSpecEditable: React.FC<GcpInfrastructureSpecEditableProps> = ({
  initialValues,
  onUpdate,
  readonly
}): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const delayedOnUpdate = React.useRef(debounce(onUpdate || noop, 300)).current
  const { getString } = useStrings()
  const { showError } = useToaster()
  const [formikInitialValues, setFormikInitialValues] = useState()
  const [isPreconfiguredHosts, setIsPreconfiguredHosts] = useState(
    initialValues.connectorRef ? PreconfiguredHosts.TRUE : PreconfiguredHosts.FALSE
  )
  const [hostsScope, setHostsScope] = useState(
    initialValues.attributeFilters || initialValues.hostFilters ? HostScope.SPECIFIC : HostScope.ALL
  )
  const [hostSpecifics, setHostSpecifics] = useState(
    initialValues.attributeFilters ? SpecificHostOption.ATTRIBUTES : SpecificHostOption.HOST_NAME
  )
  const [pdcConnectorHosts, setPdcConnectorHosts] = useState([])

  useEffect(() => {
    const setInitial = async () => {
      const values = {
        ...initialValues,
        connectorRef: initialValues.connectorRef,
        hosts: initialValues.hosts ? initialValues.hosts.join('\n') : '',
        hostFilters: initialValues.hostFilters ? initialValues.hostFilters.join('\n') : '',
        attributeFilters: initialValues.attributeFilters
          ? Object.entries(initialValues.attributeFilters)
              .map(group => `${group[0]}:${group[1]}`)
              .join('\n')
          : ''
      }
      try {
        const secretData = await setSecretField(initialValues.credentialsRef, {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier
        })
        set(values, 'sshKey', secretData)
      } catch (e) {
        showError(e.data.message || e.message)
      }
      setFormikInitialValues(values as any)
    }
    setInitial()
  }, [])

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  const formikRef = React.useRef<FormikProps<unknown> | null>(null)

  React.useEffect(() => {
    subscribeForm({ tab: DeployTabs.INFRASTRUCTURE, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.INFRASTRUCTURE, form: formikRef })
  }, [])

  const hostSpecificyOptions = useMemo(
    () => [
      { value: SpecificHostOption.HOST_NAME, label: getString('cd.steps.pdcStep.hostNameOption') },
      { value: SpecificHostOption.ATTRIBUTES, label: getString('cd.steps.pdcStep.hostAttributesOption') }
    ],
    []
  )

  return (
    <Layout.Vertical spacing="medium">
      {formikInitialValues && (
        <>
          <RadioGroup
            className={css.specifyHostsRadioGroup}
            selectedValue={isPreconfiguredHosts}
            onChange={(e: any) => {
              setIsPreconfiguredHosts(e.target.value)
            }}
          >
            <Radio value={PreconfiguredHosts.FALSE} label={getString('cd.steps.pdcStep.specifyHostsOption')} />
            <Radio value={PreconfiguredHosts.TRUE} label={getString('cd.steps.pdcStep.preconfiguredHostsOption')} />
          </RadioGroup>

          <Formik<PDCInfrastructureUI>
            formName="pdcInfra"
            initialValues={formikInitialValues}
            validationSchema={getValidationSchema(getString) as Partial<PDCInfrastructureUI>}
            validate={value => {
              const data: Partial<PdcInfrastructure> = {
                allowSimultaneousDeployments: value.allowSimultaneousDeployments,
                delegateSelectors: value.delegateSelectors,
                sshKey: value.sshKey
              }
              if (isPreconfiguredHosts === PreconfiguredHosts.FALSE) {
                data.hosts = parseHosts(value.hosts)
              } else {
                data.connectorRef = value.connectorRef
                if (hostsScope === HostScope.SPECIFIC) {
                  if (hostSpecifics === SpecificHostOption.HOST_NAME) {
                    data.hostFilters = parseHosts(value.hostFilters || '')
                  } else {
                    data.attributeFilters = parseAttributes(value.attributeFilters || '')
                  }
                }
              }
              delayedOnUpdate(data)
            }}
            onSubmit={noop}
          >
            {formik => {
              window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.INFRASTRUCTURE }))
              formikRef.current = formik
              return (
                <FormikForm>
                  <Layout.Vertical className={css.formRow} spacing="medium" margin={{ bottom: 'large' }}>
                    {isPreconfiguredHosts === PreconfiguredHosts.FALSE ? (
                      <FormInput.TextArea
                        name="hosts"
                        label={'Hosts'}
                        className={`${css.hostsTextArea} ${css.inputWidth}`}
                        tooltipProps={{
                          dataTooltipId: 'pdcHosts'
                        }}
                      />
                    ) : (
                      <Layout.Vertical>
                        <ConnectorReferenceField
                          error={
                            formik.submitCount && formik.errors.connectorRef ? formik.errors.connectorRef : undefined
                          }
                          name="connectorRef"
                          type={['Pdc']}
                          selected={formik.values.connectorRef}
                          label={getString('connector')}
                          width={366}
                          placeholder={getString('connectors.selectConnector')}
                          accountIdentifier={accountId}
                          projectIdentifier={projectIdentifier}
                          orgIdentifier={orgIdentifier}
                          onChange={(value, scope) => {
                            formik.setFieldValue('connectorRef', {
                              label: value.name || '',
                              value: `${scope !== Scope.PROJECT ? `${scope}.` : ''}${value.identifier}`,
                              scope: scope,
                              live: value?.status?.status === 'SUCCESS',
                              connector: value
                            })
                            //TODO
                            setPdcConnectorHosts([])
                          }}
                        />
                        <Layout.Horizontal className={css.hostSpecificContainer}>
                          <RadioGroup
                            className={css.specifyHostsRadioGroup}
                            selectedValue={hostsScope}
                            onChange={(e: any) => {
                              setHostsScope(e.target.value)
                              if (e.target.value === HostScope.ALL) {
                                formik.setFieldValue('attributeFilters', '')
                                formik.setFieldValue('hostFilters', '')
                              }
                            }}
                          >
                            <Radio value={HostScope.ALL} label={getString('cd.steps.pdcStep.deployAllHostsOption')} />
                            <Radio
                              value={HostScope.SPECIFIC}
                              label={getString('cd.steps.pdcStep.deploySpecificHostsOption')}
                            />
                          </RadioGroup>
                          <Select
                            disabled={hostsScope !== HostScope.SPECIFIC}
                            className={css.hostSelect}
                            value={hostSpecificyOptions.find(option => option.value === hostSpecifics)}
                            onChange={option => {
                              const value = option.value.toString()
                              if (value === SpecificHostOption.HOST_NAME) {
                                formik.setFieldValue('attributeFilters', '')
                              } else {
                                formik.setFieldValue('hostFilters', '')
                              }
                              setHostSpecifics(value)
                            }}
                            items={hostSpecificyOptions}
                          ></Select>
                        </Layout.Horizontal>
                        <Layout.Vertical spacing="medium">
                          {isPreconfiguredHosts === PreconfiguredHosts.FALSE ? (
                            <FormInput.TextArea
                              name="hosts"
                              label={'Hosts'}
                              placeholder={getString('cd.steps.pdcStep.hostsPlaceholder')}
                              className={`${css.hostsTextArea} ${css.inputWidth}`}
                              tooltipProps={{
                                dataTooltipId: 'pdcHosts'
                              }}
                            />
                          ) : hostsScope === HostScope.ALL ? null : hostSpecifics === SpecificHostOption.HOST_NAME ? (
                            <FormInput.TextArea
                              name="hostFilters"
                              label={'Specific Hosts'}
                              placeholder={getString('cd.steps.pdcStep.specificHostsPlaceholder')}
                              className={`${css.hostsTextArea} ${css.inputWidth}`}
                              tooltipProps={{
                                dataTooltipId: 'pdcSpecificHosts'
                              }}
                            />
                          ) : (
                            <FormInput.TextArea
                              name="attributeFilters"
                              label={'Specific Attributes'}
                              placeholder={getString('cd.steps.pdcStep.attributesPlaceholder')}
                              className={`${css.hostsTextArea} ${css.inputWidth}`}
                              tooltipProps={{
                                dataTooltipId: 'pdcSpecificAttributes'
                              }}
                            />
                          )}
                        </Layout.Vertical>
                      </Layout.Vertical>
                    )}
                    <div className={css.inputWidth}>
                      <SSHSecretInput name={'sshKey'} label={getString('cd.steps.common.specifyCredentials')} />
                    </div>
                    <div className={css.inputWidth}>
                      <DelegateSelectorPanel isReadonly={false} formikProps={formik} />
                    </div>
                    <PreviewHostsTable
                      hosts={
                        isPreconfiguredHosts === PreconfiguredHosts.FALSE
                          ? parseHosts(formik.values.hosts)
                          : hostSpecifics === SpecificHostOption.HOST_NAME
                          ? parseHosts(formik.values.hostFilters)
                          : pdcConnectorHosts
                      }
                      tags={formik.values.delegateSelectors}
                      secretIdentifier={formik.values.sshKey?.identifier}
                    />
                  </Layout.Vertical>

                  <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }} className={css.lastRow}>
                    <FormInput.CheckBox
                      className={css.simultaneousDeployment}
                      tooltipProps={{
                        dataTooltipId: 'pdcInfraAllowSimultaneousDeployments'
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
        </>
      )}
    </Layout.Vertical>
  )
}

interface PDCInfrastructureSpecStep extends PdcInfrastructure {
  name?: string
  identifier?: string
}

const PdcRegex = /^.+stage\.spec\.infrastructure\.infrastructureDefinition\.spec\.connectorRef$/
const SshKeyRegex = /^.+stage\.spec\.infrastructure\.infrastructureDefinition\.spec\.sshKeyRef$/
export class PDCInfrastructureSpec extends PipelineStep<PDCInfrastructureSpecStep> {
  lastFetched: number
  protected type = StepType.PDC
  protected defaultValues: PdcInfrastructure = {
    connectorRef: '',
    credentialsRef: ''
  }

  protected stepIcon: IconName = 'pdc'
  protected stepName = 'Specify your PDC Connector'
  protected stepPaletteVisible = false
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    super()
    this.lastFetched = new Date().getTime()
    this.invocationMap.set(PdcRegex, this.getConnectorsListForYaml.bind(this))
    this.invocationMap.set(SshKeyRegex, this.getSshKeyListForYaml.bind(this))

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
      if (obj.type === PdcType) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: ['Pdc'], filterType: 'Connector' }
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

  protected getSshKeyListForYaml(
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
    const { accountId } = params as {
      accountId: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.sshKey', ''))
      if (obj.type === PdcType) {
        return listSecretsV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            includeSecretsFromEverySubScope: true,
            types: ['SSHKey'],
            pageIndex: 0,
            pageSize: 100
          }
        }).then(response => {
          const data =
            response?.data?.content?.map(secret => ({
              label: secret.secret.name,
              insertText: secret.secret.identifier,
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
  }: ValidateInputSetProps<PdcInfrastructure>): FormikErrors<PdcInfrastructure> {
    const errors: Partial<PdcInfrastructureTemplate> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (
      isEmpty(data.credentialsRef) &&
      isRequired &&
      getMultiTypeFromValue(template?.credentialsRef) === MultiTypeInputType.RUNTIME
    ) {
      errors.credentialsRef = getString?.('fieldRequired', { field: getString('connector') })
    }
    return errors
  }

  renderStep(props: StepProps<PdcInfrastructure>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, customStepProps, readonly, allowableTypes } = props
    return (
      <GcpInfrastructureSpecEditable
        onUpdate={onUpdate}
        readonly={readonly}
        stepViewType={stepViewType}
        {...(customStepProps as GcpInfrastructureSpecEditableProps)}
        initialValues={initialValues}
        allowableTypes={allowableTypes}
      />
    )
  }
}
