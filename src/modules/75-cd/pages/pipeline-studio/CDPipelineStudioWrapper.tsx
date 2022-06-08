/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { TemplateSelectorContextProvider } from '@templates-library/components/TemplateSelectorContext/TemplateSelectorContext'
import CDPipelineStudio from '@cd/pages/pipeline-studio/CDPipelineStudio'
import { TemplateSelectorDrawer } from '@templates-library/components/TemplateSelectorDrawer/TemplateSelectorDrawer'

const CDPipelineStudioWrapper: React.FC = (): JSX.Element => {
  return (
    <TemplateSelectorContextProvider>
      <CDPipelineStudio />
      <TemplateSelectorDrawer />
    </TemplateSelectorContextProvider>
  )
}

export default CDPipelineStudioWrapper
