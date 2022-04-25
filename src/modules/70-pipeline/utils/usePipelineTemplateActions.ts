/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo, isEqual } from 'lodash-es'
import { parse } from 'yaml'
import produce from 'immer'
import { useCallback } from 'react'
import type { PipelineInfoConfig } from 'services/cd-ng'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useTemplateSelector } from '@pipeline/utils/useTemplateSelector'
import { createTemplate } from '@pipeline/utils/templateUtils'
import { getIdentifierFromValue } from '@common/components/EntityReference/EntityReference'

interface TemplateActionsReturnType {
  addOrUpdateTemplate: () => Promise<void>
  removeTemplate: () => Promise<void>
}

export function usePipelineTemplateActions(): TemplateActionsReturnType {
  const {
    state: { pipeline },
    updatePipeline
  } = usePipelineContext()
  const { getTemplate } = useTemplateSelector()

  const addOrUpdateTemplate = useCallback(async () => {
    const { template, isCopied } = await getTemplate({
      templateType: 'Pipeline',
      ...(pipeline.template && {
        selectedTemplateRef: getIdentifierFromValue(pipeline.template.templateRef),
        selectedVersionLabel: pipeline.template.versionLabel
      })
    })
    if (
      !isCopied &&
      isEqual(pipeline?.template?.templateRef, template.identifier) &&
      isEqual(pipeline?.template?.versionLabel, template.versionLabel)
    ) {
      return
    }
    const processNode = isCopied
      ? produce(defaultTo(parse(template?.yaml || '')?.template.spec, {}) as PipelineInfoConfig, draft => {
          draft.name = defaultTo(pipeline?.name, '')
          draft.identifier = defaultTo(pipeline?.identifier, '')
        })
      : createTemplate(pipeline, template)
    await updatePipeline(processNode)
  }, [pipeline.template, getTemplate, updatePipeline])

  const removeTemplate = useCallback(async () => {
    const node = pipeline
    const processNode = produce({} as PipelineInfoConfig, draft => {
      draft.name = defaultTo(node?.name, '')
      draft.identifier = defaultTo(node?.identifier, '')
    })
    await updatePipeline(processNode)
  }, [pipeline, updatePipeline])

  return { addOrUpdateTemplate, removeTemplate }
}
