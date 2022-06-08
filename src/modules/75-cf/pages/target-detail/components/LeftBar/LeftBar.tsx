/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useMemo } from 'react'
import { Tabs } from '@harness/uicore'
import type { Target } from 'services/cf'
import { useStrings } from 'framework/strings'
import TargetAttributes from './TargetAttributes/TargetAttributes'
import TargetGroups from './TargetGroups/TargetGroups'

import css from './LeftBar.module.scss'

export interface LeftBarProps {
  target: Target
}

const LeftBar: FC<LeftBarProps> = ({ target }) => {
  const { getString } = useStrings()

  const attributesCount = useMemo<number>(() => 2 + Object.keys(target?.attributes || {}).length, [target?.attributes])

  return (
    <div className={css.tabs}>
      <Tabs
        id="targetLeftBarTabs"
        tabList={[
          {
            id: 'targetAttributesPanel',
            title: getString('cf.targetDetail.attributes', { counter: attributesCount }),
            panel: <TargetAttributes target={target} />,
            className: css.panel
          },
          {
            id: 'targetGroupsPanel',
            title: getString('cf.shared.segments'),
            panel: <TargetGroups target={target} />,
            className: css.panel
          }
        ]}
      />
    </div>
  )
}

export default LeftBar
