/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import SplitPane from 'react-split-pane'
import { debounce, isEmpty } from 'lodash-es'
import type { TemplateFormRef } from '@templates-library/components/TemplateStudio/TemplateStudio'
import { StageTemplateFormWithRef } from '@templates-library/components/TemplateStudio/StageTemplateCanvas/StageTemplateForm/StageTemplateForm'
import { StageTemplateDiagram } from '@templates-library/components/TemplateStudio/StageTemplateCanvas/StageTemplateDiagram/StageTemplateDiagram'
import { RightDrawer } from '@pipeline/components/PipelineStudio/RightDrawer/RightDrawer'
import { SplitViewTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useSaveTemplateListener } from '@pipeline/components/PipelineStudio/hooks/useSaveTemplateListener'

const StageTemplateCanvas = (_props: unknown, formikRef: TemplateFormRef): JSX.Element => {
  const {
    state: {
      pipeline: { stages },
      pipelineView,
      pipelineView: {
        isSplitViewOpen,
        splitViewData: { type = SplitViewTypes.StageView }
      },
      selectionState: { selectedStageId }
    },
    getStageFromPipeline,
    updatePipelineView,
    setSelection
  } = usePipelineContext()
  const [splitPaneSize, setSplitPaneSize] = React.useState(200)
  const setSplitPaneSizeDeb = React.useRef(debounce(setSplitPaneSize, 200))
  const handleStageResize = (size: number): void => {
    setSplitPaneSizeDeb.current(size)
  }
  const resizerStyle = navigator.userAgent.match(/firefox/i)
    ? { display: 'flow-root list-item' }
    : { display: 'inline-table' }

  const selectedStage = getStageFromPipeline(selectedStageId || '')
  const openSplitView = isSplitViewOpen && !!selectedStage?.stage

  React.useEffect(() => {
    if (selectedStageId) {
      updatePipelineView({
        ...pipelineView,
        isSplitViewOpen: true,
        splitViewData: { type: SplitViewTypes.StageView }
      })
    }
  }, [selectedStageId])

  React.useEffect(() => {
    if (!isEmpty(stages)) {
      setSelection({ stageId: stages?.[0]?.stage?.identifier })
    }
  }, [stages])

  useSaveTemplateListener()

  return (
    <>
      <SplitPane
        size={splitPaneSize}
        split="horizontal"
        minSize={160}
        maxSize={300}
        style={{ overflow: 'auto' }}
        pane2Style={{ overflow: 'initial', zIndex: 2 }}
        resizerStyle={resizerStyle}
        onChange={handleStageResize}
      >
        <StageTemplateDiagram />
        {openSplitView && type === SplitViewTypes.StageView ? <StageTemplateFormWithRef ref={formikRef} /> : null}
      </SplitPane>
      <RightDrawer />
    </>
  )
}

export const StageTemplateCanvasWithRef = React.forwardRef(StageTemplateCanvas)
