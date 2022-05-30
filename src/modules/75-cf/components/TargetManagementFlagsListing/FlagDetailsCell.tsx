/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { FontVariation, Text } from '@harness/uicore'
import type { Feature } from 'services/cf'

export interface FlagDetailsCellProps {
  row: { original: Feature }
}

export const FlagDetailsCell: FC<FlagDetailsCellProps> = ({
  row: {
    original: { name, description }
  }
}) => (
  <>
    <Text lineClamp={1} font={{ variation: FontVariation.BODY2 }}>
      {name}
    </Text>
    {description && <Text lineClamp={2}>{description}</Text>}
  </>
)

export default FlagDetailsCell
