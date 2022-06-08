/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { Container, Tab, Tabs, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import StringWithTooltip from '@common/components/StringWithTooltip/StringWithTooltip'
import type { Target } from 'services/cf'
import TargetAttributes from '@cf/pages/target-detail/components/LeftBar/TargetAttributes/TargetAttributes'
import { DetailHeading } from '../DetailHeading'
import TargetGroups from '../../target-detail/components/LeftBar/TargetGroups/TargetGroups'

import css from './TargetSettings.module.scss'

export interface TargetSettingsProps {
  target: Target
}

export const TargetSettings: FC<TargetSettingsProps> = ({ target }) => {
  const { getString } = useStrings()

  return (
    <Container
      width={480}
      height="100%"
      background={Color.PRIMARY_BG}
      style={{ overflow: 'auto', minWidth: '480px' }}
      className={css.targetSettings}
    >
      <DetailHeading style={{ paddingBottom: 0 }}>
        <StringWithTooltip stringId="cf.targetDetail.targetSetting" tooltipId="ff_targetTargetSettings_heading" />
      </DetailHeading>
      <Container className={css.tabContainer}>
        <Tabs id="targetSettings">
          <Tab
            id="attributes"
            title={
              <Text className={css.tabTitle}>
                {/* At minimal, there are always two attributes: name and identifier */}
                {getString('cf.targetDetail.attributes', { counter: Object.keys(target?.attributes || {}).length + 2 })}
              </Text>
            }
            panelClassName={css.tabPanel}
            panel={<TargetAttributes target={target} />}
          />
          <Tab
            id="segments"
            title={<Text className={css.tabTitle}>{getString('cf.shared.segments')}</Text>}
            panelClassName={css.tabPanel}
            panel={<TargetGroups target={target} />}
          />
        </Tabs>
      </Container>
    </Container>
  )
}
