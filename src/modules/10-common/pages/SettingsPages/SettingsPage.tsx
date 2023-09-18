/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'
import cx from 'classnames'

import { IconName, Layout, Text, Card, Container, Icon } from '@harness/uicore'
import { useHistory } from 'react-router-dom'
import { Color, FontVariation, TextAlignment } from '@harness/design-system'
import { Divider } from '@blueprintjs/core'
import { LICENSE_STATE_VALUES } from 'framework/LicenseStore/licenseStoreUtil'

import css from './SettingsPages.module.scss'

export enum SettingsResourcesCategory {
  All = 'All',
  General = 'General',
  AccountResource = 'AccountResource',
  OrgResource = 'OrgResource',
  ProjectResource = 'ProjectResource',
  GitOps = 'GitOps',
  AccessControl = 'AccessControl',
  SecurityGovernance = 'SecurityGovernance',
  ExternalTickets = 'ExternalTickets',
  Subscription = 'Subscription',
  CCM = 'CCM'
}

export enum SettingsResources {
  AccountOverview = 'AccountOverview',
  DefaultSettings = 'DefaultSettings',
  Smtp = 'Smtp',
  Services = 'Services',
  Environments = 'Environments',
  ServiceOverride = 'ServiceOverride',
  Connectors = 'Connectors',
  Delegates = 'Delegates',
  Secrets = 'Secrets',
  FileStores = 'FileStores',
  Templates = 'Templates',
  Variables = 'Variables',
  Gitops_Agents = 'Gitops_Agents',
  Gitops_Repositorys = 'Gitops_Repositorys',
  Gitops_Clusters = 'Gitops_Clusters',
  Gitops_Repo_Cert = 'Gitops_Repo_Cert',
  Gitops_Gnupg_Key = 'Gitops_Gnupg_Key',
  CETAgents = 'CET_Agents',
  CETTokens = 'CET_Tokens',
  CETCriticalEvents = 'CET_Critical_Events',
  AccessControlRoles = 'AccessControlRoles',
  AccessControlUsers = 'AccessControlUsers',
  AccessControlUserGroups = 'AccessControlUserGroups',
  AccessControlResourceGroups = 'AccessControlResourceGroups',
  AccessControlServiceAccounts = 'AccessControlServiceAccounts',
  Governance = 'Governance',
  FreezeWindow = 'FreezeWindow',
  AuditTrails = 'AuditTrails',
  ExternalTickets = 'ExternalTickets',
  Webhooks = 'Webhooks',
  Authentication = 'Authentication',
  Subscription = 'Subscription',
  Billing = 'Billing',
  GitManagement = 'GitManagement',
  Discovery = 'Discovery',
  CodeErrorsSettings = 'CodeErrorsSettings',
  SLODowntime = 'SLODowntime',
  SEICollections = 'SEICollections',
  CloudCostIntegration = 'CloudCostIntegration',
  MonitoredServices = 'MonitoredServices'
}

export interface ResourceTileProps {
  label: JSX.Element
  id: string
  icon: IconName
  route?: string
  hidden?: boolean
  onHover?: () => void
  onClick?: () => void
  disabled?: boolean
  subLabel?: JSX.Element
  horizontalAlignment?: boolean
  labelAlignment?: TextAlignment
}

export interface ResourceGroupProps {
  title: string
  id: string
  description?: string
  hidden?: boolean
  onTileHover?: () => void
  isChildGroup?: boolean
}

type SettingsPageGroupProps = {
  children?: ReactElement<ResourceGroupProps>[] | ReactElement<ResourceGroupProps>
} & ResourceGroupProps

type SettingsPageProps = {
  container: React.FC<SettingsPageContainerProps>
  group: React.FC<SettingsPageGroupProps>
}

interface SettingsPageContainerProps {
  children: ReactElement<ResourceGroupProps>[] | ReactElement<ResourceGroupProps>
  moduleSpecificSettings?: React.ReactElement
}

export const SettingsResourceCard = (props: ResourceTileProps): JSX.Element => {
  const { label, icon, onClick, route, disabled, subLabel, horizontalAlignment = false, labelAlignment } = props
  const history = useHistory()

  const iconComponent = <Icon name={icon} size={32} color={Color.PRIMARY_7} className={css.tileIcon} />
  const textComponent = (
    <>
      <Text font={{ variation: FontVariation.FORM_LABEL, align: labelAlignment }} color={Color.BLACK}>
        {label}
      </Text>
      {subLabel}
    </>
  )
  return (
    <Card
      className={css.tileStyle}
      disabled={disabled}
      onClick={() => {
        onClick?.()
        if (route) {
          history.push(route)
        }
      }}
      interactive={true}
    >
      {horizontalAlignment ? (
        <Layout.Horizontal flex={{ alignItems: 'flex-start' }} height="100%" spacing="small">
          {iconComponent}
          <Container>{textComponent}</Container>
        </Layout.Horizontal>
      ) : (
        <Layout.Vertical flex={{ justifyContent: 'center' }} height="100%" spacing="small">
          {iconComponent}
          {textComponent}
        </Layout.Vertical>
      )}
    </Card>
  )
}

export const SettingsPageGroup: React.FC<SettingsPageGroupProps> = ({ children, ...props }) => {
  const { title, description, isChildGroup } = props
  return (
    <Layout.Vertical spacing="xlarge" width="100%">
      <Layout.Vertical spacing="small">
        <Layout.Horizontal spacing="medium" flex={{ justifyContent: 'space-between' }}>
          <Text
            font={{ variation: isChildGroup ? FontVariation.H5 : FontVariation.H4 }}
            color={Color.BLACK}
            style={{ whiteSpace: 'nowrap' }}
          >
            {title}
          </Text>
          {description ? null : <div className={css.noDescriptionDivider} />}
        </Layout.Horizontal>
        {description ? (
          <Text font={{ variation: FontVariation.BODY }} color={Color.BLACK}>
            {description}
          </Text>
        ) : null}
      </Layout.Vertical>
      {description ? <Divider className={css.divider} /> : null}
      <Container className={css.settingsTileWrapper}>
        {React.Children.toArray(children)
          .filter(cardInfo => !(cardInfo as React.ReactElement<ResourceTileProps>).props.hidden)
          .map(child => {
            const { props: cardInfo } = child as React.ReactElement<ResourceTileProps>
            return <SettingsResourceCard key={cardInfo.id} {...cardInfo} />
          })}
      </Container>
    </Layout.Vertical>
  )
}

export const SettingsPageContainer: React.FC<SettingsPageContainerProps> = ({ children, moduleSpecificSettings }) => {
  const [selectedListView, setSelectedListView] = React.useState<string>(SettingsResourcesCategory.All)

  return (
    <Layout.Horizontal className={css.settingsPage}>
      <Layout.Vertical className={css.settingsPageContainer}>
        <Layout.Horizontal spacing={'medium'} className={css.listToggle}>
          <Container className={css.stateToggle}>
            <Text
              key={SettingsResourcesCategory.All}
              className={cx(css.stateCtn, { [css.isSelected]: selectedListView === SettingsResourcesCategory.All })}
              font={{ variation: FontVariation.SMALL }}
              color={Color.GREY_700}
              onClick={() => {
                setSelectedListView(SettingsResourcesCategory.All)
              }}
            >
              {SettingsResourcesCategory.All}
            </Text>
            {React.Children.toArray(children)
              .filter(child => !(child as React.ReactElement<ResourceGroupProps>).props.hidden)
              .map(child => {
                const { props: childProps } = child as React.ReactElement<ResourceGroupProps>
                return (
                  <Text
                    key={childProps.id}
                    className={cx(css.stateCtn, { [css.isSelected]: selectedListView === childProps.id })}
                    font={{ variation: FontVariation.SMALL }}
                    color={Color.GREY_700}
                    onClick={() => {
                      setSelectedListView(childProps.id)
                    }}
                  >
                    {childProps.title}
                  </Text>
                )
              })}
          </Container>
        </Layout.Horizontal>
        {moduleSpecificSettings}
        <Layout.Vertical flex={{ alignItems: 'flex-start' }} className={css.settingsPageContent}>
          {React.Children.toArray(children)
            .filter(child => !(child as React.ReactElement<ResourceGroupProps>).props.hidden)
            .filter(
              child =>
                selectedListView === SettingsResourcesCategory.All ||
                (child as ReactElement<ResourceGroupProps>).props.id === selectedListView
            )
            .map(child => {
              const { props: childProps } = child as React.ReactElement<ResourceGroupProps>
              return <SettingsPageGroup key={childProps.id} {...childProps} />
            })}
        </Layout.Vertical>
      </Layout.Vertical>

      {/** commented until a generic solution is there */}
      {/* <Divider />
      <Container className={css.resourceTileInfo}>
        <Layout.Vertical>
          <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_700}>
            {
              'Configure overall settings of your Account or manage resources to be shared across different Organizations/Projects.'
            }
          </Text>
          <Layout.Horizontal spacing="xxlarge" flex={{ justifyContent: 'center' }}>
            <img width={124} height={124} src={HoverInfoSvg} />
            <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_500}>
              {'Hover on the tiles to learn more!'}
            </Text>
          </Layout.Horizontal>
        </Layout.Vertical>
      </Container> */}
    </Layout.Horizontal>
  )
}

export const SettingsPage: SettingsPageProps = {
  container: SettingsPageContainer,
  group: SettingsPageGroup
}

export const isActiveLicense = (licenseState: LICENSE_STATE_VALUES): boolean => {
  return licenseState === LICENSE_STATE_VALUES.ACTIVE
}
