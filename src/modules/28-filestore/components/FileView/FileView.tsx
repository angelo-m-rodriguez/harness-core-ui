/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React from 'react'
import { Container, Tabs } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import FileDetails from '@filestore/components/FileView/FileDetails/FileDetails'

import css from '@filestore/components/FileView/FileView.module.scss'

export default function FileView(): React.ReactElement {
  const { getString } = useStrings()
  return (
    <Container style={{ width: '100%' }} className={css.mainFileView}>
      <Tabs
        id={'serviceLandingPageTabs'}
        defaultSelectedTabId={'details'}
        tabList={[
          {
            id: 'details',
            title: getString('details'),
            panel: <FileDetails />
          },
          { id: 'referencedBy', title: getString('refrencedBy'), panel: <div /> },
          { id: 'activityLog', title: getString('activityLog'), panel: <div /> }
        ]}
      />
    </Container>
  )
}
