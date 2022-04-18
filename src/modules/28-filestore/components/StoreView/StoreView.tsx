/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout } from '@wings-software/uicore'

export interface StoreViewProps {
  title?: string
}

export default function StoreView({ title = '' }: StoreViewProps): React.ReactElement {
  return (
    <Layout.Vertical height="100%" width="100%">
      <Container padding="xlarge">
        {title}
        {/* TODO: Implement design */}
      </Container>
    </Layout.Vertical>
  )
}
