/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { MouseEvent, useState } from 'react'
import {
  Text,
  Layout,
  Button,
  Popover,
  StepsProgress,
  ButtonVariation,
  ButtonSize,
  IconName
} from '@wings-software/uicore'
import { Position, Intent, PopoverInteractionKind } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import type { IconProps } from '@harness/icons'
import defaultTo from 'lodash-es/defaultTo'
import { useStrings } from 'framework/strings'
import { ConnectorConnectivityDetails, ConnectorValidationResult, ErrorDetail, useValidateHosts } from 'services/cd-ng'
import { ConnectorStatus } from '@connectors/constants'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useTestConnectionErrorModal from '@connectors/common/useTestConnectionErrorModal/useTestConnectionErrorModal'

import css from './ConnectivityStatus.module.scss'

export type ErrorMessage = ConnectorValidationResult & { useErrorHandler?: boolean }

export interface ConnectivityStatusProps {
  identifier: string
  host: string
  tags: string[]
  status: any
}

interface WarningTooltipProps {
  errorSummary?: string
  errors?: ErrorDetail[]
  onClick: (event: MouseEvent<HTMLDivElement>) => void
  errorDetailsText: string
  noDetailsText: string
}

const WarningTooltip: React.FC<WarningTooltipProps> = ({
  errorSummary,
  errors,
  onClick,
  errorDetailsText,
  noDetailsText
}) => {
  if (errorSummary) {
    return (
      <Layout.Vertical font={{ size: 'small' }} spacing="small" padding="small">
        <Text font={{ size: 'small' }} color={Color.WHITE}>
          {errorSummary}
        </Text>
        {errors ? (
          <Text color={Color.BLUE_400} onClick={onClick} className={css.viewDetails}>
            {errorDetailsText}
          </Text>
        ) : null}
      </Layout.Vertical>
    )
  }
  return (
    <Text padding="small" color={Color.WHITE}>
      {noDetailsText}
    </Text>
  )
}

const ConnectivityStatus: React.FC<ConnectivityStatusProps> = data => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<ConnectorConnectivityDetails['status']>(data?.status?.status || 'UNKNOWN')

  const [errorMessage, setErrorMessage] = useState<ErrorMessage>()
  const { getString } = useStrings()
  const { identifier, host, tags } = data
  const [stepDetails, setStepDetails] = useState<any>({
    step: 1,
    intent: Intent.WARNING,
    status: 'PROCESS'
  })

  const { openErrorModal } = useTestConnectionErrorModal({})

  const { mutate: validateHosts } = useValidateHosts({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      identifier
    }
  })

  const executeStepVerify = async (): Promise<void> => {
    try {
      const result = await validateHosts({ hosts: [host], tags })
      if (result.status === 'SUCCESS') {
        setStatus('SUCCESS')
        setStepDetails({
          step: 2,
          intent: Intent.SUCCESS,
          status: 'DONE'
        })
      } else {
        setStatus('FAILURE')
        setErrorMessage({ ...result.data, useErrorHandler: false })
        setStepDetails({
          step: 1,
          intent: Intent.DANGER,
          status: 'ERROR'
        })
      }
      setTesting(false)
    } catch (err: any) {
      /* istanbul ignore next */
      setStatus('FAILURE')
      if (err?.data?.responseMessages) {
        /* istanbul ignore next */
        setErrorMessage({
          errorSummary: err?.data?.message,
          errors: err?.data?.responseMessages,
          useErrorHandler: true
        })
      } else {
        /* istanbul ignore next */
        setErrorMessage({ ...err.message, useErrorHandler: false })
      }
      /* istanbul ignore next */
      setStepDetails({
        step: 1,
        intent: Intent.DANGER,
        status: 'ERROR'
      })
      /* istanbul ignore next */
      setTesting(false)
    }
  }

  const renderStatusText = (
    icon: IconName,
    iconProps: Partial<IconProps>,
    tooltip: JSX.Element | string,
    statusText: string
  ): React.ReactElement => {
    return (
      <Text
        inline
        icon={icon}
        iconProps={iconProps}
        tooltip={tooltip}
        tooltipProps={{ isDark: true, position: 'bottom', popoverClassName: css.tooltip }}
      >
        {statusText}
      </Text>
    )
  }

  const connectorStatus = defaultTo(status, data.status?.status)
  const isStatusSuccess = connectorStatus === ConnectorStatus.SUCCESS
  const errorSummary = defaultTo(errorMessage?.errorSummary, data?.status?.errorSummary)

  const renderTooltip = () => {
    return (
      <WarningTooltip
        errorSummary={errorSummary}
        errors={defaultTo(errorMessage?.errors, data?.status?.errors)}
        onClick={e => {
          e.stopPropagation()
          openErrorModal((errorMessage as ErrorMessage) || data?.status)
        }}
        errorDetailsText={getString('connectors.testConnectionStep.errorDetails')}
        noDetailsText={getString('noDetails')}
      />
    )
  }

  const renderStatus = () => {
    const statusMessageMap = {
      [`${ConnectorStatus.SUCCESS}`]: getString('success'),
      [`${ConnectorStatus.FAILURE}`]: getString('failed')
    }

    const statusMsg = defaultTo(statusMessageMap[`${connectorStatus}`], getString('na'))
    if (isStatusSuccess) {
      return renderStatusText('full-circle', { size: 6, color: Color.GREEN_500 }, '', statusMsg)
    }

    return renderStatusText('warning-sign', { size: 12, color: Color.RED_500 }, renderTooltip(), statusMsg)
  }

  if (testing) {
    return (
      <Layout.Horizontal>
        <Popover interactionKind={PopoverInteractionKind.HOVER} position={Position.LEFT_TOP}>
          <Button intent="primary" minimal loading />
          <div className={css.testConnectionPop}>
            <StepsProgress
              steps={['step 1 name']}
              intent={stepDetails.intent}
              current={stepDetails.step}
              currentStatus={stepDetails.status}
            />
          </div>
        </Popover>
        <Text style={{ margin: 8 }}>{getString('connectors.testInProgress')}</Text>
      </Layout.Horizontal>
    )
  }

  return (
    <Layout.Horizontal>
      <Layout.Vertical width="100px">
        <Layout.Horizontal spacing="small">{renderStatus()}</Layout.Horizontal>
      </Layout.Vertical>
      {!isStatusSuccess ? (
        <Button
          variation={ButtonVariation.SECONDARY}
          size={ButtonSize.SMALL}
          text={getString('test')}
          className={css.testBtn}
          onClick={e => {
            e.stopPropagation()
            setTesting(true)
            executeStepVerify()
            setStepDetails({
              step: 1,
              intent: Intent.WARNING,
              status: 'PROCESS'
            })
          }}
          withoutBoxShadow
        />
      ) : undefined}
    </Layout.Horizontal>
  )
}

export default ConnectivityStatus
