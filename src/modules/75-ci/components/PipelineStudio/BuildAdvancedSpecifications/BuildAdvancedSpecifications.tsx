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
import { useStrings } from 'framework/strings'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { StepActions } from '@common/constants/TrackingConstants'
import type { BuildStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { LoopingStrategy } from '@pipeline/components/PipelineStudio/LoopingStrategy/LoopingStrategy'
import css from './BuildAdvancedSpecifications.module.scss'

export interface AdvancedSpecifications {
  context?: string
}
const BuildAdvancedSpecifications: React.FC<AdvancedSpecifications> = ({ children }): JSX.Element => {
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
  const { stage } = getStageFromPipeline(selectedStageId || '')

  const formikRef = React.useRef<StepFormikRef | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <div className={cx(css.stageSection, css.editStageGrid)}>
      <div className={css.contentSection} ref={scrollRef}>
        <div className={css.tabHeading}>
          <span data-tooltip-id="conditionalExecutionBuildStage">
            {getString('pipeline.conditionalExecution.title')}
            <HarnessDocTooltip tooltipId="conditionalExecutionBuildStage" useStandAlone={true} />
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
                      const { stage: pipelineStage } = getStageFromPipeline<BuildStageElementConfig>(
                        selectedStageId || ''
                      )
                      if (pipelineStage && pipelineStage.stage) {
                        const stageData = produce(pipelineStage, draft => {
                          set(draft, 'stage.when', when)
                        })

                        if (stageData.stage) updateStage(stageData.stage)
                      }
                    }}
                  />
                </div>
              </div>
            </Layout.Horizontal>
          </Card>
        )}
        <div className={css.tabHeading}>
          <span data-tooltip-id="loopingStrategyBuildStage">
            {getString('pipeline.loopingStrategy.title')}
            <HarnessDocTooltip tooltipId="loopingStrategyBuildStage" useStandAlone={true} />
          </span>
        </div>
        <Card className={css.sectionCard} id="loopingStrategy">
          <Layout.Horizontal>
            <div className={css.stageSection}>
              <div className={cx(css.stageCreate, css.stageDetails)}>
                <LoopingStrategy
                  strategy={stage?.stage?.strategy}
                  isReadonly={isReadonly}
                  onUpdateStrategy={strategy => {
                    const { stage: pipelineStage } = getStageFromPipeline(selectedStageId || '')
                    if (pipelineStage && pipelineStage.stage) {
                      const stageData = produce(pipelineStage, draft => {
                        set(draft, 'stage.strategy', strategy)
                      })
                      if (stageData.stage) updateStage(stageData.stage)
                    }
                  }}
                />
              </div>
            </div>
          </Layout.Horizontal>
        </Card>
        <div className={css.tabHeading}>
          <span data-tooltip-id="failureStrategyBuildStage">
            {getString('pipeline.failureStrategies.title')}
            <HarnessDocTooltip tooltipId="failureStrategyBuildStage" useStandAlone={true} />
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

                      if (stageData.stage) {
                        updateStage(stageData.stage)
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

export default BuildAdvancedSpecifications
