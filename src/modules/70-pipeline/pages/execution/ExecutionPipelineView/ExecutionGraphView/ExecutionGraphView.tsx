/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { debounce, omit } from 'lodash-es'
import SplitPane, { SplitPaneProps } from 'react-split-pane'

import { isExecutionNotStarted, isExecutionSkipped } from '@pipeline/utils/statusHelpers'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import { useLocalStorage, useUpdateQueryParams } from '@common/hooks'
import type { ExecutionPageQueryParams } from '@pipeline/utils/types'
import ExecutionStepDetails from '@pipeline/components/ExecutionStepDetails/ExecutionStepDetails'
import {
  ExecutionLayoutContext,
  ExecutionLayoutState
} from '@pipeline/components/ExecutionLayout/ExecutionLayoutContext'
import ExecutionLayoutFloatingView from '@pipeline/components/ExecutionLayout/ExecutionLayoutFloatingView'

import { ExecutionStageDetailsHeader } from './ExecutionStageDetailsHeader/ExecutionStageDetailsHeader'
import ExecutionGraph from './ExecutionGraph/ExecutionGraph'
import ExecutionStageDetails from './ExecutionStageDetails/ExecutionStageDetails'

import css from './ExecutionGraphView.module.scss'

export const PANEL_RESIZE_DELTA = 50
export const MIN_PANEL_SIZE = 200
const IS_TEST = process.env.NODE_ENV === 'test'
const RIGHT_LAYOUT_DEFAULT_SIZE = 570
const BOTTOM_LAYOUT_DEFAULT_SIZE = 500
const EXECUTION_LAYOUT_DOM_ID = `execution-layout-${IS_TEST ? 'test' : /* istanbul ignore next */ Date.now()}`

const splitPaneProps: Partial<Record<ExecutionLayoutState, SplitPaneProps>> = {
  [ExecutionLayoutState.RIGHT]: {
    split: 'vertical',
    defaultSize: RIGHT_LAYOUT_DEFAULT_SIZE,
    minSize: 300,
    maxSize: -300,
    primary: 'second'
  },
  [ExecutionLayoutState.BOTTOM]: {
    split: 'horizontal',
    defaultSize: BOTTOM_LAYOUT_DEFAULT_SIZE,
    minSize: 200,
    maxSize: -100,
    primary: 'first'
  }
}

const styles: React.CSSProperties = {
  overflow: 'unset',
  position: 'static',
  height: 'min-content'
}

export default function ExecutionGraphView(): React.ReactElement {
  const { replaceQueryParams } = useUpdateQueryParams<ExecutionPageQueryParams>()
  const { allNodeMap, pipelineStagesMap, selectedStageId, queryParams, setSelectedStepId } = useExecutionContext()

  function handleStepSelection(step?: string): void {
    if (!step) {
      const params = {
        ...queryParams
      }

      delete params.step

      replaceQueryParams(params)
      setSelectedStepId('')
    } else {
      const selectedStep = allNodeMap?.[step]

      if (isExecutionNotStarted(selectedStep?.status) || isExecutionSkipped(selectedStep?.status)) {
        return
      }

      const params = {
        ...queryParams,
        stage: selectedStageId,
        step
      }

      replaceQueryParams(params)
    }
  }

  function handleStageSelection(stage: string, stageId?: string): void {
    const selectedStage = pipelineStagesMap.get(stage)

    if (isExecutionNotStarted(selectedStage?.status) || isExecutionSkipped(selectedStage?.status)) {
      return
    }

    const params = {
      ...queryParams,
      stage,
      stageId
    }

    delete params.step

    replaceQueryParams(params)
  }

  const [layouts, setLayoutState] = useLocalStorage<ExecutionLayoutState[]>(
    'execution_layout_2', // increase the number in case data structure is changed
    [ExecutionLayoutState.RIGHT]
  )
  const [layoutState] = layouts
  const [isStepDetailsVisible, setStepDetailsVisibility] = React.useState(false)
  const [primaryPaneSize, setPrimaryPaneSize] = React.useState(250)
  const [tertiaryPaneSize, setTertiaryPaneSize] = React.useState(
    layoutState === ExecutionLayoutState.RIGHT ? RIGHT_LAYOUT_DEFAULT_SIZE : BOTTOM_LAYOUT_DEFAULT_SIZE
  )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setStageSplitPaneSizeDebounce = React.useCallback(debounce(setPrimaryPaneSize, 300), [setPrimaryPaneSize])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setStepSplitPaneSizeDebounce = React.useCallback(debounce(setTertiaryPaneSize, 300), [setTertiaryPaneSize])

  /* Ignoring this function as it is used by "react-split-pane" */
  /* istanbul ignore next */
  function handleStageResize(size: number): void {
    setStageSplitPaneSizeDebounce(size)
  }

  function setLayout(e: ExecutionLayoutState): void {
    setLayoutState(prevState => [e, ...prevState.slice(0, 1)])
  }

  function restoreDialog(): void {
    setLayoutState(prevState => {
      const prevNonMinState = prevState.find(s => s !== ExecutionLayoutState.MINIMIZE)

      return [prevNonMinState || ExecutionLayoutState.RIGHT, ExecutionLayoutState.MINIMIZE]
    })
  }

  // handle layout change
  React.useEffect(() => {
    if (layoutState === ExecutionLayoutState.RIGHT) {
      setTertiaryPaneSize(RIGHT_LAYOUT_DEFAULT_SIZE)
    } else if (layoutState === ExecutionLayoutState.BOTTOM) {
      setTertiaryPaneSize(BOTTOM_LAYOUT_DEFAULT_SIZE)
    }
  }, [layoutState])

  const child1 = <ExecutionGraph onSelectedStage={handleStageSelection} />
  const child2 = (
    <ExecutionStageDetails
      layout={layoutState}
      onStepSelect={handleStepSelection}
      onStageSelect={handleStageSelection}
    />
  )
  const child3 = <ExecutionStepDetails />

  let stageGraphPaneStyles = { ...styles }

  if (layoutState === ExecutionLayoutState.RIGHT) {
    Object.assign(stageGraphPaneStyles, {
      position: 'sticky',
      top: 'var(--execution-stage-details-height)',
      heigth: 'min-content'
    })
  } else if (layoutState === ExecutionLayoutState.BOTTOM) {
    stageGraphPaneStyles = {
      overflow: 'hidden'
    }
  }
  return (
    <ExecutionLayoutContext.Provider
      value={{
        layout: layoutState,
        setLayout,
        primaryPaneSize,
        tertiaryPaneSize,
        setPrimaryPaneSize,
        setTertiaryPaneSize,
        isStepDetailsVisible,
        setStepDetailsVisibility,
        restoreDialog
      }}
    >
      <div className={css.main} id={EXECUTION_LAYOUT_DOM_ID}>
        <SplitPane
          split="horizontal"
          className={css.splitPane1}
          minSize={MIN_PANEL_SIZE}
          size={primaryPaneSize}
          onChange={handleStageResize}
          pane1Style={omit(styles, 'height')}
          pane2Style={styles}
          style={styles}
        >
          {child1}
          <div className={css.stageDetails}>
            <ExecutionStageDetailsHeader />
            {isStepDetailsVisible &&
            (layoutState === ExecutionLayoutState.BOTTOM || layoutState === ExecutionLayoutState.RIGHT) ? (
              <SplitPane
                className={css.splitPane2}
                {...splitPaneProps[layoutState]}
                size={tertiaryPaneSize}
                onChange={setStepSplitPaneSizeDebounce}
                pane1Style={stageGraphPaneStyles}
                pane2Style={styles}
                style={styles}
              >
                {child2}
                {child3}
              </SplitPane>
            ) : (
              <React.Fragment>
                {child2}
                {isStepDetailsVisible ? <ExecutionLayoutFloatingView>{child3}</ExecutionLayoutFloatingView> : null}
              </React.Fragment>
            )}
          </div>
        </SplitPane>
      </div>
    </ExecutionLayoutContext.Provider>
  )
}
