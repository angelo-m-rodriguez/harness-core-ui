/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef } from 'react'
import cx from 'classnames'
import { Button, Icon, Layout, Tab, Tabs } from '@wings-software/uicore'
import { Expander } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useStrings } from 'framework/strings'
import type { StageElementConfig } from 'services/cd-ng'
import { SaveTemplateButton } from '@pipeline/components/PipelineStudio/SaveTemplateButton/SaveTemplateButton'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { isContextTypeNotStageTemplate } from '@pipeline/components/PipelineStudio/PipelineUtils'
import ApprovalAdvancedSpecifications from '../ApprovalStage/ApprovalStageAdvanced'
import { ApprovalStageOverview } from '../ApprovalStage/ApprovalStageOverview'
import { ApprovalStageExecution } from '../ApprovalStage/ApprovalStageExecution'
import approvalStepCss from '../ApprovalStage/ApprovalStageSetupShellMode.module.scss'

export function CustomStageSetupShellMode(): React.ReactElement {
  const { getString } = useStrings()
  const tabHeadings = [getString('overview'), getString('executionText'), getString('advancedTitle')]
  const isTemplatesEnabled = useFeatureFlag(FeatureFlag.NG_TEMPLATES)
  const layoutRef = useRef<HTMLDivElement>(null)
  const [selectedTabId, setSelectedTabId] = React.useState<string>(tabHeadings[1])
  const pipelineContext = usePipelineContext()
  const {
    state: {
      pipeline,
      selectionState: { selectedStageId = '', selectedStepId }
    },
    contextType,
    getStageFromPipeline,
    updatePipeline
  } = pipelineContext

  const { stage: selectedStage } = getStageFromPipeline<StageElementConfig>(selectedStageId)

  React.useEffect(() => {
    if (selectedStepId) {
      setSelectedTabId(tabHeadings[1])
    }
  }, [selectedStepId])

  function ActionButton(): React.ReactElement {
    return (
      <Layout.Horizontal spacing="medium" padding="medium" className={approvalStepCss.footer}>
        <Button
          text={getString('next')}
          intent="primary"
          rightIcon="chevron-right"
          onClick={() => {
            updatePipeline(pipeline)
            setSelectedTabId(tabHeadings[1])
          }}
        />
      </Layout.Horizontal>
    )
  }

  React.useLayoutEffect(() => {
    // To drag and drop the canvas
    if (layoutRef.current) {
      /* istanbul ignore next */
      layoutRef.current.scrollTo?.(0, 0)
    }
  }, [selectedTabId])

  return (
    <section ref={layoutRef} key={selectedStageId} className={approvalStepCss.approvalStageSetupShellWrapper}>
      <Tabs
        id="approvalStageSetupShell"
        onChange={(tabId: string) => setSelectedTabId(tabId)}
        selectedTabId={selectedTabId}
        data-tabId={selectedTabId}
      >
        <Tab
          id={tabHeadings[0]}
          panel={
            <ApprovalStageOverview>
              <ActionButton />
            </ApprovalStageOverview>
          }
          title={
            <span className={approvalStepCss.tab}>
              <Icon name="tick" height={20} size={20} color={Color.GREEN_800} />
              {tabHeadings[0]}
            </span>
          }
          data-testid={tabHeadings[0]}
        />
        <Icon
          name="chevron-right"
          height={20}
          size={20}
          margin={{ right: 'small', left: 'small' }}
          color={'grey400'}
          style={{ alignSelf: 'center' }}
        />
        <Tab
          id={tabHeadings[1]}
          title={
            <span className={approvalStepCss.tab}>
              <Icon name="deployment-success-legacy" height={20} size={20} />
              {tabHeadings[1]}
            </span>
          }
          panel={<ApprovalStageExecution />}
          data-testid={tabHeadings[1]}
          className={cx(approvalStepCss.fullHeight, approvalStepCss.stepGroup)}
        />
        <Icon
          name="chevron-right"
          height={20}
          size={20}
          margin={{ right: 'small', left: 'small' }}
          color={'grey400'}
          style={{ alignSelf: 'center' }}
        />
        <Tab
          id={tabHeadings[2]}
          title={
            <span className={approvalStepCss.tab}>
              <Icon name="advanced" height={20} size={20} />
              {tabHeadings[2]}
            </span>
          }
          panel={
            <ApprovalAdvancedSpecifications
              conditionalExecutionTooltipId="conditionalExecutionCustomStage"
              failureStrategyTooltipId="failureStrategyCustomStage"
            />
          }
          data-testid={tabHeadings[2]}
        />
        {/* istanbul ignore next */}
        {isTemplatesEnabled &&
          isContextTypeNotStageTemplate(contextType) &&
          /* istanbul ignore next */ selectedStage?.stage && (
            <>
              <Expander />
              <SaveTemplateButton data={selectedStage.stage} type={'Stage'} />
            </>
          )}
      </Tabs>
    </section>
  )
}
