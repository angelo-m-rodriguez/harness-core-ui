/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Layout,
  Button,
  Formik,
  Text,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  FormikForm as Form,
  StepProps,
  ButtonVariation
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { DelegateTypes } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type {
  ConnectorConfigDTO,
  ConnectorRequestBody,
  ConnectorInfoDTO,
  EntityGitDetails,
  ResponseConnectorResponse
} from 'services/cd-ng'
import { PageSpinner } from '@common/components'
import {
  DelegateOptions,
  DelegateSelector,
  DelegatesFoundState
} from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelector/DelegateSelector'
import { CredTypeValues, HashiCorpVaultAccessTypes } from '@connectors/interfaces/ConnectorInterface'
import useCreateEditConnector, { BuildPayloadProps } from '@connectors/hooks/useCreateEditConnector'
import { useConnectorWizard } from '@connectors/components/CreateConnectorWizard/ConnectorWizardContext'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import css from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelector/DelegateSelector.module.scss'

interface DelegateSelectorStepData extends BuildPayloadProps {
  delegateSelectors: Array<string>
}

export interface DelegateSelectorProps {
  buildPayload: (data: DelegateSelectorStepData) => ConnectorRequestBody
  hideModal?: () => void
  onConnectorCreated?: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode?: (val: boolean) => void
  connectorInfo: ConnectorInfoDTO | void
  gitDetails?: EntityGitDetails
  disableGitSync?: boolean
  submitOnNextStep?: boolean
  customHandleCreate?: (payload: ConnectorConfigDTO) => Promise<ConnectorInfoDTO | undefined>
  customHandleUpdate?: (payload: ConnectorConfigDTO) => Promise<ConnectorInfoDTO | undefined>
  helpPanelReferenceId?: string
}

type InitialFormData = { delegateSelectors: Array<string> }

const NoMatchingDelegateWarning: React.FC<{ delegatesFound: DelegatesFoundState; delegateSelectors: string[] }> =
  props => {
    const { getString } = useStrings()
    const { delegatesFound, delegateSelectors } = props
    if (delegatesFound === DelegatesFoundState.ActivelyConnected) {
      return <></>
    }
    const message =
      delegatesFound === DelegatesFoundState.NotConnected
        ? getString('connectors.delegate.noMatchingDelegatesActive')
        : getString('connectors.delegate.noMatchingDelegate', { tags: delegateSelectors.join(', ') })
    const dataName =
      delegatesFound === DelegatesFoundState.NotConnected ? 'delegateNoActiveMatchWarning' : 'delegateNoMatchWarning'
    return (
      <Text
        icon="warning-sign"
        iconProps={{ margin: { right: 'xsmall' }, color: Color.YELLOW_900 }}
        font={{ size: 'small', weight: 'semi-bold' }}
        data-name={dataName}
        className={css.noDelegateWarning}
      >
        {message}
      </Text>
    )
  }

function getInitialDelegateSelectors(
  isEditMode: boolean,
  connectorInfo: ConnectorInfoDTO | void,
  prevStepData: ConnectorConfigDTO | undefined
) {
  if (!isEditMode) {
    return []
  }
  let delegate = (connectorInfo as ConnectorInfoDTO & InitialFormData)?.spec?.delegateSelectors || []
  if (prevStepData?.delegateSelectors) {
    delegate = prevStepData.delegateSelectors
  }
  return delegate
}

const isDelegateSelectorMandatory = (prevStepData: ConnectorConfigDTO = {}): boolean => {
  return (
    DelegateTypes.DELEGATE_IN_CLUSTER === prevStepData?.delegateType ||
    DelegateTypes.DELEGATE_IN_CLUSTER_IRSA === prevStepData?.delegateType ||
    CredTypeValues.AssumeIAMRole === prevStepData?.credType ||
    CredTypeValues.AssumeRoleSTS === prevStepData?.credType ||
    HashiCorpVaultAccessTypes.VAULT_AGENT === prevStepData?.accessType ||
    HashiCorpVaultAccessTypes.K8s_AUTH === prevStepData?.accessType
  )
}

const DelegateSelectorStep: React.FC<StepProps<ConnectorConfigDTO> & DelegateSelectorProps> = props => {
  const { prevStepData, nextStep, buildPayload, customHandleCreate, customHandleUpdate, connectorInfo } = props
  const {
    accountId,
    projectIdentifier: projectIdentifierFromUrl,
    orgIdentifier: orgIdentifierFromUrl
  } = useParams<any>()
  const projectIdentifier = connectorInfo ? connectorInfo.projectIdentifier : projectIdentifierFromUrl
  const orgIdentifier = connectorInfo ? connectorInfo.orgIdentifier : orgIdentifierFromUrl
  const { getString } = useStrings()
  const isGitSyncEnabled = useAppStore().isGitSyncEnabled && !props.disableGitSync && orgIdentifier && projectIdentifier
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  useConnectorWizard({
    helpPanel: props.helpPanelReferenceId ? { referenceId: props.helpPanelReferenceId, contentWidth: 1050 } : undefined
  })

  const afterSuccessHandler = (response: ResponseConnectorResponse): void => {
    props.onConnectorCreated?.(response?.data)
    if (prevStepData?.branch) {
      // updating connector branch to handle if new branch was created while commit
      prevStepData.branch = response?.data?.gitDetails?.branch
    }

    if (stepDataRef?.skipDefaultValidation) {
      props.hideModal?.()
    } else {
      nextStep?.({ ...prevStepData, ...stepDataRef } as ConnectorConfigDTO)
      props.setIsEditMode?.(true)
    }
  }

  const initialDelegateSelectors = getInitialDelegateSelectors(props.isEditMode, props.connectorInfo, prevStepData)

  const initialValues = { delegateSelectors: initialDelegateSelectors }
  const [delegateSelectors, setDelegateSelectors] = useState<Array<string>>(initialDelegateSelectors)
  const [mode, setMode] = useState<DelegateOptions>(
    delegateSelectors.length || isDelegateSelectorMandatory(prevStepData)
      ? DelegateOptions.DelegateOptionsSelective
      : DelegateOptions.DelegateOptionsAny
  )
  const [delegatesFound, setDelegatesFound] = useState<DelegatesFoundState>(DelegatesFoundState.ActivelyConnected)
  let stepDataRef: ConnectorConfigDTO | null = null

  const { onInitiate, loading } = useCreateEditConnector<DelegateSelectorStepData>({
    accountId,
    isEditMode: props.isEditMode,
    isGitSyncEnabled,
    afterSuccessHandler,
    gitDetails: props.gitDetails
  })

  const isSaveButtonDisabled =
    (isDelegateSelectorMandatory(prevStepData) && delegateSelectors.length === 0) ||
    (mode === DelegateOptions.DelegateOptionsSelective && delegateSelectors.length === 0) ||
    loading

  const connectorName = (prevStepData as ConnectorConfigDTO)?.name || (connectorInfo as ConnectorInfoDTO)?.name
  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.DelegateSelectorStepLoad, {
    category: Category.CONNECTOR
  })

  return (
    <>
      {!isGitSyncEnabled && loading ? (
        <PageSpinner
          message={
            props.isEditMode
              ? getString('connectors.updating', { name: connectorName })
              : getString('connectors.creating', { name: connectorName })
          }
        />
      ) : null}
      <Layout.Vertical height={'inherit'} padding={{ left: 'small' }}>
        <Text
          font={{ variation: FontVariation.H3 }}
          margin={{ top: 'small' }}
          color={Color.BLACK}
          id="delegateSelectorStepTitle"
        >
          {getString('delegate.DelegateselectionLabel')}
        </Text>
        <ModalErrorHandler bind={setModalErrorHandler} />
        <Formik
          initialValues={{
            ...initialValues,
            ...prevStepData
          }}
          formName="delegateSelectorStepForm"
          //   Enable when delegateSelector adds form validation
          // validationSchema={Yup.object().shape({
          //   delegateSelector: Yup.string().when('delegateType', {
          //     is: DelegateTypes.DELEGATE_IN_CLUSTER,
          //     then: Yup.string().trim().required(i18n.STEP.TWO.validation.delegateSelector)
          //   })
          // })}
          onSubmit={stepData => {
            trackEvent(ConnectorActions.DelegateSelectorStepSubmit, {
              category: Category.CONNECTOR
            })
            modalErrorHandler?.hide()
            const updatedStepData = {
              ...stepData,
              delegateSelectors: mode === DelegateOptions.DelegateOptionsAny ? [] : delegateSelectors
            }

            if (props.submitOnNextStep) {
              nextStep?.({ ...prevStepData, ...updatedStepData, projectIdentifier, orgIdentifier })
              return
            }

            const connectorData: DelegateSelectorStepData = {
              ...prevStepData,
              ...updatedStepData,
              projectIdentifier: projectIdentifier,
              orgIdentifier: orgIdentifier
            }
            stepDataRef = updatedStepData

            onInitiate({
              connectorFormData: connectorData,
              buildPayload,
              customHandleCreate,
              customHandleUpdate
            })
          }}
        >
          <Form>
            <DelegateSelector
              mode={mode}
              setMode={setMode}
              delegateSelectors={delegateSelectors}
              setDelegateSelectors={setDelegateSelectors}
              setDelegatesFound={setDelegatesFound}
              delegateSelectorMandatory={isDelegateSelectorMandatory(prevStepData)}
              accountId={accountId}
              orgIdentifier={orgIdentifier}
              projectIdentifier={projectIdentifier}
            />
            <Layout.Horizontal padding={{ top: 'small' }} margin={{ top: 'xxxlarge' }} spacing="medium">
              <Button
                text={getString('back')}
                icon="chevron-left"
                onClick={() => props?.previousStep?.(props?.prevStepData)}
                data-name="awsBackButton"
                variation={ButtonVariation.SECONDARY}
              />
              <Button
                type="submit"
                intent={'primary'}
                text={getString(props.submitOnNextStep ? 'continue' : 'saveAndContinue')}
                className={css.saveAndContinue}
                disabled={isSaveButtonDisabled}
                rightIcon="chevron-right"
                data-testid="delegateSaveAndContinue"
              />
              <NoMatchingDelegateWarning delegatesFound={delegatesFound} delegateSelectors={delegateSelectors} />
            </Layout.Horizontal>
          </Form>
        </Formik>
      </Layout.Vertical>
    </>
  )
}

export default DelegateSelectorStep
