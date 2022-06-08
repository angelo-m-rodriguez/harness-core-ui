/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text } from '@harness/uicore'
import css from './HorizontalLineWithText.module.scss'

interface HorizontalLineWithTextProps {
  text: string
}

export default function HorizontalLineWithText(props: HorizontalLineWithTextProps): JSX.Element {
  const { text } = props
  return (
    <div className={css.separator}>
      <div className={css.line}></div>
      <Text className={css.separatorText} font={{ size: 'small' }}>
        {text}
      </Text>
      <div className={css.line}></div>
    </div>
  )
}
