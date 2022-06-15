/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import moment from 'moment'
import { Classes } from '@blueprintjs/core'
import { Layout, Container, Text } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { EnvironmentToolTipDisplay } from '@cv/components/HarnessServiceAndEnvironment/components/EnvironmentToolTipDisplay'
import type { ToolbarProps } from '../MonitoredServicePage.types'
import type { ExtendedMonitoredServiceDTO } from '../components/Configurations/Configurations.utils'

const DetailsToolbar: React.FC<ToolbarProps> = ({ loading, monitoredService, lastModifiedAt }) => {
  const { getString } = useStrings()

  const envRefList = (monitoredService as ExtendedMonitoredServiceDTO)?.environmentRefList

  if (loading) {
    return (
      <Layout.Vertical spacing="xsmall">
        <Container height={15} width={220} className={Classes.SKELETON} />
        <Container height={15} width={220} className={Classes.SKELETON} />
        <Container height={15} width={220} className={Classes.SKELETON} />
      </Layout.Vertical>
    )
  }

  return (
    <Layout.Vertical spacing="xsmall" style={{ textAlign: 'right' }}>
      <Layout.Horizontal flex={{ justifyContent: 'flex-end' }}>
        <Text color={Color.GREY_500} font={{ variation: FontVariation.SMALL }}>{`${getString('lastUpdated')}: `}</Text>
        <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL_SEMI }}>
          &nbsp; {`${moment(lastModifiedAt).format('lll')}`}
        </Text>
      </Layout.Horizontal>
      {monitoredService?.type === 'Infrastructure' ? (
        <Layout.Horizontal>
          <Text color={Color.GREY_500} font={{ variation: FontVariation.SMALL }}>
            {`${getString('environment')}:`}
          </Text>
          <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL_SEMI }}>
            {`${envRefList?.slice(0, 1).join(',')}`}

            {envRefList && envRefList?.length > 1 ? <span>+{envRefList.length - 1}</span> : ''}
          </Text>
        </Layout.Horizontal>
      ) : (
        <Layout.Horizontal flex={{ justifyContent: 'flex-end' }}>
          <Text
            color={Color.GREY_500}
            title={monitoredService?.environmentRef}
            font={{ variation: FontVariation.SMALL }}
          >
            {`${getString('environment')}:`}
          </Text>
          <Text
            color={Color.BLACK}
            title={monitoredService?.environmentRef}
            font={{ variation: FontVariation.SMALL_SEMI }}
          >
            &nbsp; {monitoredService?.environmentRef}
          </Text>
        </Layout.Horizontal>
      )}
      <Layout.Horizontal flex={{ justifyContent: 'flex-end' }}>
        <Text color={Color.GREY_500} font={{ variation: FontVariation.SMALL }}>
          {`${getString('typeLabel')}:`}
        </Text>
        <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL_SEMI }}>
          &nbsp; {` ${monitoredService?.type}`}
        </Text>
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export default DetailsToolbar
