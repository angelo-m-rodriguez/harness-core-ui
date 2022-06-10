/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'

import { Container } from '@harness/uicore'

import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'

import DeployServiceErrors from '@cd/components/PipelineStudio/DeployServiceSpecifications/DeployServiceErrors'

import DeployInfraDefinition from './DeployInfraDefinition/DeployInfraDefinition'

import stageCss from '../DeployStageSetupShell/DeployStage.module.scss'

export default function DeployInfraSpecifications(props: React.PropsWithChildren<unknown>): JSX.Element {
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const { submitFormsForTab } = React.useContext(StageErrorContext)
  const { errorMap } = useValidationErrors()
  React.useEffect(() => {
    if (errorMap.size > 0) {
      submitFormsForTab(DeployTabs.INFRASTRUCTURE)
    }
  }, [errorMap])

  return (
    <div className={stageCss.deployStage} key="1">
      <DeployServiceErrors domRef={scrollRef as React.MutableRefObject<HTMLElement | undefined>} />
      <div className={cx(stageCss.contentSection, stageCss.paddedSection)} ref={scrollRef}>
        <DeployInfraDefinition />
        <Container margin={{ top: 'xxlarge' }}>{props.children}</Container>
      </div>
    </div>
  )
}
