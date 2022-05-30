/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { useParams } from 'react-router-dom'
import { Page, Tabs } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { Feature, Segment, useGetSegment } from 'services/cf'
import { useGetEnvironment } from 'services/cd-ng'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import StringWithTooltip from '@common/components/StringWithTooltip/StringWithTooltip'
import { AuditLogObjectType } from '@cf/utils/CFUtils'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { AuditLogs } from '@cf/components/AuditLogs/AuditLogs'
import TargetManagementDetailPageTemplate from '@cf/components/TargetManagementDetailPageTemplate/TargetManagementDetailPageTemplate'
import TargetGroupCriteria from './components/TargetGroupCriteria'
import FlagSettingsPanel from './components/FlagSettingsPanel/FlagSettingsPanel'
import useDeleteTargetGroupDialog from './hooks/useDeleteTargetGroupDialog'

import css from './TargetGroupDetailPage.module.scss'

const TargetGroupDetailPage: FC = () => {
  const { getString } = useStrings()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()

  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    segmentIdentifier
  } = useParams<Record<string, string>>()

  const {
    data: targetGroup,
    loading: targetGroupLoading,
    error: targetGroupError,
    refetch: refetchTargetGroup
  } = useGetSegment({
    identifier: segmentIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    }
  })

  const {
    data: envData,
    loading: envLoading,
    error: envError,
    refetch: refetchEnv
  } = useGetEnvironment({
    environmentIdentifier,
    queryParams: {
      accountId: accountIdentifier,
      orgIdentifier,
      projectIdentifier
    }
  })

  const deleteTargetGroupDialog = useDeleteTargetGroupDialog(targetGroup as Segment)

  if (targetGroupLoading || envLoading) {
    return <ContainerSpinner flex={{ align: 'center-center' }} />
  }

  if (targetGroupError || envError) {
    return (
      <Page.Error
        message={targetGroupError?.message || envError?.message}
        onClick={async () => {
          await Promise.all([refetchTargetGroup(), refetchEnv()])
        }}
      />
    )
  }

  return (
    <TargetManagementDetailPageTemplate
      item={targetGroup as Segment}
      openDeleteDialog={deleteTargetGroupDialog}
      metaData={{ environment: envData?.data?.name as string }}
      leftBar={<TargetGroupCriteria targetGroup={targetGroup as Segment} reloadTargetGroup={refetchTargetGroup} />}
    >
      <div className={css.tabs}>
        <Tabs
          id="TargetGroupDetailPageTabs"
          tabList={[
            {
              id: 'FlagSettingsTab',
              title: (
                <StringWithTooltip
                  stringId="cf.targetDetail.flagSetting"
                  tooltipId="ff_targetGroupDetail_flagSettings_heading"
                />
              ),
              panel: <FlagSettingsPanel targetGroup={targetGroup as Segment} />,
              panelClassName: css.panel
            },
            {
              id: 'AuditLogsTab',
              title: getString('activityLog'),
              panel: <AuditLogs flagData={targetGroup as Feature} objectType={AuditLogObjectType.Segment} />,
              panelClassName: css.panel
            }
          ]}
        />
      </div>
    </TargetManagementDetailPageTemplate>
  )
}

export default TargetGroupDetailPage
