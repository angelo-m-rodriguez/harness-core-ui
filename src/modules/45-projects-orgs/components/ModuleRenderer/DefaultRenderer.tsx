/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Icon, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import css from './ModuleRenderer.module.scss'

const DefaultRenderer: React.FC = () => {
  const { getString } = useStrings()
  const { CDNG_ENABLED, CVNG_ENABLED, CING_ENABLED, CENG_ENABLED, CFNG_ENABLED, SECURITY } = useFeatureFlags()

  return (
    <Layout.Vertical padding={{ top: 'xlarge' }} className={css.started}>
      <Text font={{ size: 'small', weight: 'semi-bold' }} padding={{ bottom: 'xsmall' }}>
        {getString('modules')}
      </Text>
      <Layout.Horizontal spacing="small">
        {CDNG_ENABLED ? <Icon name="cd-main" size={20} /> : null}
        {CING_ENABLED ? <Icon name="ci-main" size={20} /> : null}
        {CFNG_ENABLED ? <Icon name="cf-main" size={20} /> : null}
        {CENG_ENABLED ? <Icon name="ce-main" size={20} /> : null}
        {CVNG_ENABLED ? <Icon name="cv-main" size={20} /> : null}
        {SECURITY ? <Icon name="sto-color-filled" size={20} /> : null}
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export default DefaultRenderer
