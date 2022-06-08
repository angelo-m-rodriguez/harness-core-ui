/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Heading, Layout, StepProps } from '@wings-software/uicore'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { CE_K8S_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import CopyCodeSection from './components/CopyCodeSection'
import css from './CEK8sConnector.module.scss'

interface SecretCreationStepProps {
  name: string
}

interface StepSecretManagerProps extends ConnectorInfoDTO {
  spec: any
}

const SecretCreationStep: React.FC<StepProps<StepSecretManagerProps> & SecretCreationStepProps> = props => {
  const { prevStepData, nextStep, previousStep } = props

  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()

  useStepLoadTelemetry(CE_K8S_CONNECTOR_CREATION_EVENTS.LOAD_SECRET_CREATION)

  const [secretYaml] = useState<string>(
    yamlStringify({
      apiVersion: 'v1',
      data: {
        token: '<paste token here>'
      },
      kind: 'Secret',
      metadata: {
        name: 'harness-api-key',
        namespace: 'harness-autostopping'
      },
      type: 'Opaque'
    })
  )

  const handleprev = () => {
    previousStep?.({ ...prevStepData } as ConnectorInfoDTO)
  }

  const handleSubmit = () => {
    trackEvent(ConnectorActions.SecretCreationStepSubmit, {
      category: Category.CONNECTOR
    })
    nextStep?.({ ...prevStepData } as ConnectorInfoDTO)
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.SecretCreationStepLoad, {
    category: Category.CONNECTOR
  })

  return (
    <Layout.Vertical className={css.secretCreationCont}>
      <Heading level={2} className={css.header}>
        {'Secret Creation'}
      </Heading>
      <ol type="1">
        <li>
          {getString('connectors.ceK8.secretCreationStep.step1')}
          <a
            href={`${window.location.origin}/#/account/${accountId}/access-management/api-keys`}
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>
        </li>
        <li>{getString('connectors.ceK8.secretCreationStep.step2')}</li>
        <CopyCodeSection snippet={getString('connectors.ceK8.secretCreationStep.namespaceCommand')} />
        <li>{getString('connectors.ceK8.secretCreationStep.step3')}</li>
        <CopyCodeSection snippet={`${secretYaml}`} />
        <li>{getString('connectors.ceK8.secretCreationStep.step4')}</li>
        <CopyCodeSection snippet={getString('connectors.ceK8.secretCreationStep.creationCommand')} />
      </ol>
      <Layout.Horizontal className={css.buttonPanel} spacing="small">
        <Button text={getString('previous')} icon="chevron-left" onClick={handleprev}></Button>
        <Button
          type="submit"
          intent="primary"
          text={getString('continue')}
          rightIcon="chevron-right"
          onClick={handleSubmit}
        />
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export default SecretCreationStep
