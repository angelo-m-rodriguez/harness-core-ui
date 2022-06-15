/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Card, NoDataCard } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import noServiceAvailableImage from '@cv/assets/noServiceAvailable.png'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { ErrorTracking as EventList, EventListProps } from '@cv/ErrorTrackingApp'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import routes from '@common/RouteDefinitions'
import type { MetricsAndLogsProps } from '../MetricsAndLogs/MetricsAndLogs.types'
import css from './ErrorTracking.module.scss'

const ErrorTracking: React.FC<MetricsAndLogsProps> = props => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { startTime, endTime } = props

  const componentLocation = {
    pathname: '/events'
  }

  return (
    <Container style={{ height: '100%' }}>
      {startTime && endTime ? (
        <ChildAppMounter<EventListProps>
          ChildApp={EventList}
          componentLocation={componentLocation}
          orgId={orgIdentifier}
          accountId={accountId}
          projectId={projectIdentifier}
          serviceId={props.serviceIdentifier}
          environmentId={props.environmentIdentifier}
          fromDateTime={Math.floor(startTime / 1000)}
          toDateTime={Math.floor(endTime / 1000)}
          routeDefinitions={routes}
        />
      ) : (
        <Card className={css.noServiceImageCard} data-testid="error-tracking-analysis-image-view">
          <NoDataCard
            image={noServiceAvailableImage}
            message={getString('cv.monitoredServices.serviceHealth.selectTimelineErrorTracking')}
            containerClassName={css.noDataCardContainer}
            className={css.noDataCard}
            imageClassName={css.noServiceImage}
          />
        </Card>
      )}
    </Container>
  )
}

export default ErrorTracking
