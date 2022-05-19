/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { HelpPanelContextProvider, HelpPanelEnvironment } from '@harness/help-panel'
// import { useFeatureFlags } from '@common/hooks/useFeatureFlag'

const HelpPanelProvider: React.FC = props => {
  // const { HELP_PANEL } = useFeatureFlags()

  return (
    <HelpPanelContextProvider
      accessToken="5EHT-ZBWYjweBLS62PNKf-vp3ZbXAylRUlPRPcHwqAg"
      space="jj62blws1bo9"
      environment={HelpPanelEnvironment.qa}
    >
      {props.children}
    </HelpPanelContextProvider>
  )
}

export default HelpPanelProvider
