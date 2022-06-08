/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { NotificationRuleRefDTO, useGetNotificationRulesForSLO } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { GET_NOTIFICATIONS_PAGE_SIZE } from '@cv/components/Notifications/NotificationsContainer.constants'
import SLOTargetNotifications from './SLOTargetNotifications'

interface SLOTargetNotificationsContainerProps {
  notificationRuleRefs?: NotificationRuleRefDTO[]
  setFieldValue: (field: string, value: any) => void
  identifier: string
}

export default function SLOTargetNotificationsContainer(props: SLOTargetNotificationsContainerProps): JSX.Element {
  const { setFieldValue, identifier } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [page, setPage] = useState(0)

  const {
    data,
    loading,
    error,
    refetch: getNotifications
  } = useGetNotificationRulesForSLO({
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier,
      pageNumber: page,
      pageSize: GET_NOTIFICATIONS_PAGE_SIZE
    },
    identifier,
    lazy: true
  })

  useEffect(() => {
    if (identifier) {
      getNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier])

  return (
    <SLOTargetNotifications
      setFieldValue={setFieldValue}
      initialNotificationsTableData={data?.data?.content || []}
      setPage={setPage}
      page={page}
      loading={loading}
      error={error}
      getNotifications={getNotifications}
    />
  )
}
