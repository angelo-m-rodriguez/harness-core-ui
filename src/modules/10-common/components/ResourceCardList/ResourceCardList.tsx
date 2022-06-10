/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import cx from 'classnames'
import { Button, ButtonSize, Card, Layout, Text, useToggleOpen } from '@wings-software/uicore'
import { Icon, IconName } from '@harness/icons'
import { FontVariation, Color } from '@harness/design-system'
import { String, useStrings } from 'framework/strings'
import type { OrgPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import useCreateSmtpModal from '@common/components/Smtp/useCreateSmtpModal'
import { useGetSmtpConfig } from 'services/cd-ng'
import { isPR, isLocalHost } from '@common/utils/utils'
import css from './ResourceCardList.module.scss'

export interface ResourceOption {
  label: JSX.Element
  icon: IconName
  route?: string
  colorClass?: string
  onClick?: () => void
  subLabel?: JSX.Element
  disabled?: boolean
  selectable?: boolean
}
interface ResourceCardListProps {
  items?: ResourceOption[]
}

const ResourceCardList: React.FC<ResourceCardListProps> = ({ items }) => {
  const { accountId, orgIdentifier } = useParams<OrgPathProps>()
  const history = useHistory()
  const { getString } = useStrings()
  const { NG_TEMPLATES, NG_VARIABLES } = useFeatureFlags()
  const { isOpen: showGitOpsEntities, toggle: toggleShowGitOpsEntities } = useToggleOpen()
  const { loading, data, refetch } = useGetSmtpConfig({ queryParams: { accountId } })
  const refetchSmtpData = (): void => {
    refetch()
  }
  const { openCreateSmtpModal } = useCreateSmtpModal({ onCloseModal: refetchSmtpData })
  // showGitOpsCard defaults to false for now while the feature is being developed
  const showGitOpsCard = useMemo(
    () => history?.location?.pathname.includes('resources') && (isPR() || isLocalHost()),
    [history?.location?.pathname]
  )
  const smtpResource: ResourceOption[] = [
    {
      label: <String stringID="common.smtp.conifg" />,
      icon: 'smtp',
      disabled: loading,
      colorClass: css.smtp,
      onClick: () => {
        if (!loading) {
          if (!data?.data) {
            openCreateSmtpModal(data?.data)
          } else {
            history.push(routes.toAccountSMTP({ accountId }))
          }
        }
      },
      subLabel: (
        <>
          {loading ? (
            <Icon name="spinner" size={14} />
          ) : (
            <>
              {!data?.data ? (
                <Button intent="primary" icon={'small-plus'} size={ButtonSize.SMALL} text={getString('common.setup')} />
              ) : (
                <Layout.Horizontal flex={{ alignItems: 'center' }} margin={'xsmall'} spacing="xsmall">
                  <Icon name="tick-circle" size={14} color={Color.GREEN_500} />

                  <Text font={{ variation: FontVariation.FORM_HELP }}>{getString('common.smtp.configured')}</Text>
                </Layout.Horizontal>
              )}
            </>
          )}
        </>
      )
    }
  ]
  const gitOpsCard: ResourceOption[] = [
    {
      label: <String stringID="common.gitOps" />,
      icon: 'gitops-blue',
      onClick: toggleShowGitOpsEntities,
      selectable: true
    } as ResourceOption
  ]
  const options: ResourceOption[] = items || [
    {
      label: <String stringID="connectorsLabel" />,
      icon: 'connectors-icon',
      route: routes.toConnectors({ accountId, orgIdentifier }),
      colorClass: css.connectors
    },
    {
      label: <String stringID="delegate.delegates" />,
      icon: 'delegates-icon' as IconName,
      route: routes.toDelegates({ accountId, orgIdentifier }),
      colorClass: css.delegates
    },
    {
      label: <String stringID="common.secrets" />,
      icon: 'secrets-icon',
      colorClass: css.secrets,
      route: routes.toSecrets({ accountId, orgIdentifier })
    },
    ...(!orgIdentifier ? smtpResource : []),
    ...(NG_TEMPLATES
      ? [
          {
            label: <String stringID="common.templates" />,
            icon: 'templates-icon',
            colorClass: css.templates,
            route: routes.toTemplates({ accountId, orgIdentifier })
          } as ResourceOption
        ]
      : []),
    ...(NG_VARIABLES
      ? [
          {
            label: <String stringID="common.variables" />,
            icon: 'variable',
            colorClass: css.variables,
            route: routes.toVariables({ accountId, orgIdentifier })
          } as ResourceOption
        ]
      : []),
    ...(showGitOpsCard ? gitOpsCard : [])
  ]

  const gitOpsEntities = [
    {
      label: <String stringID="common.agents" />,
      icon: 'gitops-agent-blue',
      route: routes.toAccountResourcesGitOps({ accountId, entity: 'agents' })
    } as ResourceOption,
    {
      label: <String stringID="repositories" />,
      icon: 'gitops-repository-blue',
      route: routes.toAccountResourcesGitOps({ accountId, entity: 'repositories' })
    } as ResourceOption,
    {
      label: <String stringID="common.repositoryCertificates" />,
      icon: 'gitops-repo-cert-blue',
      route: routes.toAccountResourcesGitOps({ accountId, entity: 'repoCertificates' })
    } as ResourceOption,
    {
      label: <String stringID="common.clusters" />,
      icon: 'gitops-clusters-blue',
      route: routes.toAccountResourcesGitOps({ accountId, entity: 'clusters' })
    } as ResourceOption,
    {
      label: <String stringID="common.gnupgKeys" />,
      icon: 'gitops-gnupg-key-blue',
      route: routes.toAccountResourcesGitOps({ accountId, entity: 'gnuPGKeys' })
    } as ResourceOption
  ]

  return (
    <>
      <div className={css.cardsWrapper}>
        {options.map(option => (
          <Card
            key={option.icon}
            className={cx(css.card, option.colorClass)}
            disabled={option.disabled}
            onClick={() => {
              option?.onClick?.()
              if (option.route) {
                history.push(option.route)
              }
            }}
            selected={option.selectable && showGitOpsEntities}
          >
            <Layout.Vertical flex spacing="small">
              <Icon name={option.icon} size={70} />
              <Text color={Color.BLACK} font={{ weight: 'semi-bold' }}>
                {option.label}
              </Text>
              {option.subLabel}
            </Layout.Vertical>
            {showGitOpsEntities && option.icon.includes('gitops') && <div className={css.arrowDown} />}
          </Card>
        ))}
      </div>
      {showGitOpsEntities && (
        <div className={css.gitOpsEntities}>
          <Text color={Color.BLACK} font={{ size: 'medium', weight: 'semi-bold' }} margin={{ bottom: 'medium' }}>
            {getString('common.gitOps')}
          </Text>
          <div className={css.cardsWrapper}>
            {gitOpsEntities.map(gitOpsEntity => (
              <Card
                key={gitOpsEntity.icon}
                className={cx(css.card)}
                onClick={() => {
                  gitOpsEntity?.onClick?.()
                  if (gitOpsEntity.route) {
                    history.push(gitOpsEntity.route)
                  }
                }}
              >
                <Layout.Vertical flex spacing="small">
                  <Icon name={gitOpsEntity.icon} size={70} />
                  <Text color={Color.BLACK} font={{ weight: 'semi-bold' }}>
                    {gitOpsEntity.label}
                  </Text>
                  {gitOpsEntity.subLabel}
                </Layout.Vertical>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default ResourceCardList
