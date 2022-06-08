/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Link } from '@wings-software/uicore'
import classNames from 'classnames'
import { Color } from '@harness/design-system'
import { Connectors } from '@connectors/constants'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { String, StringKeys } from 'framework/strings'
import { CredTypeValues } from '@connectors/interfaces/ConnectorInterface'
import { DelegateTypes } from './ConnectorUtils'
import css from '../views/ConnectorsListView.module.scss'

const textRenderer = (value: string): JSX.Element => {
  if (!value) {
    return <></>
  }
  return (
    <Text inline margin={{ left: 'xsmall' }} color={Color.BLACK}>
      {value}
    </Text>
  )
}

const getAWSDisplaySummary = (connector: ConnectorInfoDTO): JSX.Element | string => {
  if (
    connector?.spec?.credential?.type === DelegateTypes.DELEGATE_IN_CLUSTER ||
    connector?.spec?.credential?.type === DelegateTypes.DELEGATE_IN_CLUSTER_IRSA
  ) {
    return displayDelegatesTagsSummary(connector.spec.delegateSelectors)
  }
  return getConnectorDisplaySummaryLabel(
    'connectors.aws.accessKey',
    textRenderer(connector?.spec?.credential?.spec?.accessKeyRef || connector?.spec?.credential?.spec?.accessKey)
  )
}

const linkRenderer = (value: string): JSX.Element => {
  if (!value) {
    return <></>
  }
  return (
    <Link
      margin={{ left: 'xsmall' }}
      className={css.link}
      href={value}
      onClick={e => e.stopPropagation()}
      target="_blank"
      title={value}
    >
      {value}
    </Link>
  )
}

const getGCPDisplaySummary = (connector: ConnectorInfoDTO): JSX.Element | string => {
  if (connector?.spec?.credential?.type === DelegateTypes.DELEGATE_IN_CLUSTER) {
    return displayDelegatesTagsSummary(connector.spec.delegateSelectors)
  }
  return getConnectorDisplaySummaryLabel(
    'encryptedKeyLabel',
    textRenderer(connector?.spec?.credential?.spec?.secretKeyRef)
  )
}

const getConnectorDisplaySummaryLabel = (titleStringId: StringKeys, Element: JSX.Element): JSX.Element | string => {
  return (
    <div className={classNames(css.name, css.flex)}>
      {titleStringId ? (
        <Text inline color={Color.BLACK}>
          <String stringID={titleStringId} />:
        </Text>
      ) : null}
      {Element}
    </div>
  )
}

const displayDelegatesTagsSummary = (delegateSelectors: []): JSX.Element => {
  return (
    <div className={classNames(css.name)}>
      <Text inline color={Color.BLACK}>
        <String stringID={'delegate.delegateTags'} />:
      </Text>
      <Text inline margin={{ left: 'xsmall' }} color={Color.GREY_400}>
        {delegateSelectors?.join?.(', ')}
      </Text>
    </div>
  )
}

const getK8DisplaySummary = (connector: ConnectorInfoDTO): JSX.Element | string => {
  if (connector?.spec?.credential?.type === DelegateTypes.DELEGATE_IN_CLUSTER) {
    return displayDelegatesTagsSummary(connector.spec.delegateSelectors)
  }
  return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.credential?.spec?.masterUrl))
}

const getAWSSecretManagerSummary = (connector: ConnectorInfoDTO): JSX.Element | string => {
  if (connector?.spec?.credential?.type !== CredTypeValues.ManualConfig) {
    return displayDelegatesTagsSummary(connector.spec.delegateSelectors)
  }
  return getConnectorDisplaySummaryLabel(
    'connectors.aws.accessKey',
    textRenderer(connector?.spec?.credential?.spec?.accessKey)
  )
}

export const getConnectorDisplaySummary = (connector: ConnectorInfoDTO): JSX.Element | string => {
  switch (connector?.type) {
    case Connectors.KUBERNETES_CLUSTER:
      return getK8DisplaySummary(connector)
    case Connectors.HttpHelmRepo:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.helmRepoUrl))
    case Connectors.Jira:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.jiraUrl))
    case Connectors.SERVICE_NOW:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.serviceNowUrl))
    case Connectors.GIT:
    case Connectors.GITHUB:
    case Connectors.GITLAB:
    case Connectors.BITBUCKET:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.url))
    case Connectors.DOCKER:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.dockerRegistryUrl))
    case Connectors.JENKINS:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.jenkinsUrl))
    case Connectors.NEXUS:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.nexusServerUrl))
    case Connectors.ARTIFACTORY:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.artifactoryServerUrl))
    case Connectors.AWS:
      return getAWSDisplaySummary(connector)
    case Connectors.GCP:
      return getGCPDisplaySummary(connector)
    case Connectors.NEW_RELIC:
    case Connectors.DATADOG:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.url))
    case Connectors.APP_DYNAMICS:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.controllerUrl))
    case Connectors.SPLUNK:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.splunkUrl))
    case Connectors.AWS_SECRET_MANAGER:
      return getAWSSecretManagerSummary(connector)
    case Connectors.DYNATRACE:
      return getConnectorDisplaySummaryLabel('UrlLabel', linkRenderer(connector?.spec?.url))
    default:
      return ''
  }
}
