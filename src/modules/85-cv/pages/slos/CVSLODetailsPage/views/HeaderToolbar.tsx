/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import moment from 'moment'
import { Classes } from '@blueprintjs/core'
import { Color, Container, FontVariation, Layout, Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { HeaderToolbarProps } from '../CVSLODetailsPage.types'

const HeaderToolbar: React.FC<HeaderToolbarProps> = ({ loading, createdAt, lastModifiedAt }) => {
  const { getString } = useStrings()

  if (loading) {
    return (
      <Layout.Vertical height="100%" flex={{ justifyContent: 'flex-end', alignItems: 'end' }} spacing="xsmall">
        <Container height={12} width={200} className={Classes.SKELETON} />
        <Container height={12} width={200} className={Classes.SKELETON} />
      </Layout.Vertical>
    )
  }

  if (!createdAt || !lastModifiedAt) {
    return null
  }

  const DATE_FORMAT = 'D MMM YYYY h:mm:ss A'
  const lastModifiedOn = `${getString('cv.lastModifiedOn')} ${moment(new Date(lastModifiedAt)).format(DATE_FORMAT)}`
  const createdOn = `${getString('cv.createdOn')} ${moment(new Date(createdAt)).format(DATE_FORMAT)}`

  return (
    <Layout.Vertical height="100%" flex={{ justifyContent: 'flex-end', alignItems: 'end' }}>
      <Text font={{ variation: FontVariation.TINY_SEMI }} color={Color.GREY_500}>
        {lastModifiedOn}
      </Text>
      <Text font={{ variation: FontVariation.TINY_SEMI }} color={Color.GREY_500}>
        {createdOn}
      </Text>
    </Layout.Vertical>
  )
}

export default HeaderToolbar
