/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Card, HarnessDocTooltip, Layout } from '@wings-software/uicore'
import React from 'react'
import cx from 'classnames'
import { produce } from 'immer'
import { isEmpty, set } from 'lodash-es'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { FailureStrategyWithRef } from '@pipeline/components/PipelineStudio/FailureStrategy/FailureStrategy'
import type { StepFormikRef } from '@pipeline/components/PipelineStudio/StepCommands/StepCommands'
import ConditionalExecution from '@pipeline/components/PipelineStudio/ConditionalExecution/ConditionalExecution'
import { StepActions } from '@common/constants/TrackingConstants'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { useStrings } from 'framework/strings'
import type { ApprovalStageElementConfig } from '@pipeline/utils/pipelineTypes'
import css from './ApprovalAdvancedSpecifications.module.scss'

export interface AdvancedSpecifications {
  context?: string
  conditionalExecutionTooltipId?: string
  failureStrategyTooltipId?: string
}
function ApprovalAdvancedSpecifications({
  children,
  conditionalExecutionTooltipId = 'conditionalExecutionApprovalStage',
  failureStrategyTooltipId = 'failureStrategyApprovalStage'
}: React.PropsWithChildren<AdvancedSpecifications>): React.ReactElement {
  const { getString } = useStrings()
  const { trackEvent } = useTelemetry()

  const {
    state: {
      selectionState: { selectedStageId }
    },
    isReadonly,
    getStageFromPipeline,
    updateStage
  } = usePipelineContext()
  const { stage } = getStageFromPipeline<ApprovalStageElementConfig>(selectedStageId || '')

  const formikRef = React.useRef<StepFormikRef | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <div className={cx(css.stageSection, css.editStageGrid)}>
      <div className={css.contentSection} ref={scrollRef}>
        <div className={css.tabHeading}>
          <span data-tooltip-id={conditionalExecutionTooltipId}>
            {getString('pipeline.conditionalExecution.title')}
            <HarnessDocTooltip tooltipId={conditionalExecutionTooltipId} useStandAlone={true} />
          </span>
        </div>
        {!!stage && (
          <Card className={css.sectionCard} id="conditionalExecution">
            <Layout.Horizontal>
              <div className={css.stageSection}>
                <div className={cx(css.stageCreate, css.stageDetails)}>
                  <ConditionalExecution
                    isReadonly={isReadonly}
                    selectedStage={stage}
                    onUpdate={when => {
                      const { stage: pipelineStage } = getStageFromPipeline(selectedStageId || '')
                      if (pipelineStage && pipelineStage.stage) {
                        const stageData = produce(pipelineStage, draft => {
                          set(draft, 'stage.when', when)
                        })
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        updateStage(stageData.stage!)
                      }
                    }}
                  />
                </div>
              </div>
            </Layout.Horizontal>
          </Card>
        )}
        <div className={css.tabHeading}>
          <span data-tooltip-id={failureStrategyTooltipId}>
            {getString('pipeline.failureStrategies.title')}
            <HarnessDocTooltip tooltipId={failureStrategyTooltipId} useStandAlone={true} />
          </span>
        </div>
        <Card className={css.sectionCard} id="failureStrategy">
          <Layout.Horizontal>
            <div className={css.stageSection}>
              <div className={cx(css.stageCreate, css.stageDetails)}>
                <FailureStrategyWithRef
                  selectedStage={stage}
                  isReadonly={isReadonly}
                  ref={formikRef}
                  onUpdate={({ failureStrategies }) => {
                    const { stage: pipelineStage } = getStageFromPipeline(selectedStageId || '')
                    if (pipelineStage && pipelineStage.stage) {
                      const stageData = produce(pipelineStage, draft => {
                        set(draft, 'stage.failureStrategies', failureStrategies)
                      })
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      updateStage(stageData.stage!)
                      const errors = formikRef.current?.getErrors()
                      if (isEmpty(errors)) {
                        const telemetryData = failureStrategies.map(strategy => ({
                          onError: strategy.onFailure?.errors?.join(', '),
                          action: strategy.onFailure?.action?.type
                        }))
                        telemetryData.length &&
                          trackEvent(StepActions.AddEditFailureStrategy, { data: JSON.stringify(telemetryData) })
                      }
                    }
                  }}
                />
              </div>
            </div>
          </Layout.Horizontal>
        </Card>
        <div className={cx(css.navigationButtons)}>{children}</div>
      </div>
    </div>
  )
}

export default ApprovalAdvancedSpecifications
