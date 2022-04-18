/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { NewFileButton } from '@filestore/common/NewFile/NewFile'

import css from './StoreExplorer.module.scss'

export interface StoreExplorerProps {
  title?: string
}

export default function StoreExplorer({ title = '' }: StoreExplorerProps): React.ReactElement {
  return (
    <Layout.Vertical height="100%">
      <Container background={Color.GREY_0} padding={{ top: 'medium', left: 'medium' }} className={css.explorer}>
        {/* TODO: Implement explorer design */}
        {title}
        <NewFileButton />
      </Container>
    </Layout.Vertical>
  )
}
