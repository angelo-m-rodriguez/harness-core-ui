/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { NoDataCard } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { ConnectorResponse } from 'services/cd-ng'
import EntitySetupUsage from '@common/pages/entityUsage/EntityUsage'
import { EntityType } from '@common/pages/entityUsage/EntityConstants'
import ActivityHistory from '@connectors/components/activityHistory/ActivityHistory/ActivityHistory'
import ConnectorView from '../../ConnectorView'
import { ConnectorDetailsView } from '../../utils/ConnectorHelper'

interface RenderConnectorDetailsActiveTabProps {
  activeCategory: ConnectorDetailsView
  data: ConnectorResponse
  refetch: () => Promise<void>
}

const RenderConnectorDetailsActiveTab: React.FC<RenderConnectorDetailsActiveTabProps> = ({
  activeCategory,
  data,
  refetch
}) => {
  const { getString } = useStrings()
  switch (activeCategory) {
    case ConnectorDetailsView.overview:
      return data.connector?.type ? (
        <ConnectorView
          type={data.connector.type}
          response={data || ({} as ConnectorResponse)}
          refetchConnector={refetch}
        />
      ) : (
        <NoDataCard message={getString('connectors.connectorNotFound')} icon="question" />
      )
    case ConnectorDetailsView.referencedBy:
      return data.connector?.identifier ? (
        <EntitySetupUsage entityType={EntityType.Connectors} entityIdentifier={data.connector.identifier} />
      ) : (
        <></>
      )
    case ConnectorDetailsView.activityHistory:
      return <ActivityHistory referredEntityType="Connectors" entityIdentifier={data.connector?.identifier || ''} />
    default:
      return <></>
  }
}

export default RenderConnectorDetailsActiveTab
