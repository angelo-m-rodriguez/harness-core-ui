/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import produce from 'immer'
import { set } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, templatePathProps } from '@common/utils/routeUtils'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import pipelineContextMock from '@pipeline/components/PipelineStudio/RightDrawer/__tests__/stateMock'
import { StageType } from '@pipeline/utils/stageHelpers'
import { stageTemplateMock } from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import {
  DefaultNewStageId,
  DefaultNewStageName
} from '@templates-library/components/TemplateStudio/StageTemplateCanvas/StageTemplateForm/StageTemplateForm'
import { StageTemplateCanvasWithRef } from '../StageTemplateCanvas'

jest.mock('@wings-software/monaco-yaml/lib/esm/languageservice/yamlLanguageService', () => ({
  getLanguageService: jest.fn()
}))

jest.mock('@pipeline/components/PipelineStudio/RightDrawer/RightDrawer', () => ({
  RightDrawer: () => <div />
}))

describe('<StageTemplateCanvasWithRef /> tests', () => {
  test('should match snapshot in empty state', async () => {
    const context = produce(pipelineContextMock, draft => {
      set(draft, 'state.pipeline.stages[0].stage', {
        ...stageTemplateMock.spec,
        name: DefaultNewStageName,
        identifier: DefaultNewStageId
      })
      draft.stagesMap = {
        Deployment: {
          name: 'Deploy',
          type: StageType.DEPLOY,
          icon: 'cd-main',
          iconColor: 'var(--pipeline-deploy-stage-color)',
          isApproval: false,
          openExecutionStrategy: true
        }
      }
    })
    const { container } = render(
      <PipelineContext.Provider value={context}>
        <TestWrapper
          path={routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...pipelineModuleParams })}
          pathParams={{
            templateIdentifier: 'new_stage_name',
            accountId: 'accountId',
            orgIdentifier: 'default',
            projectIdentifier: 'Yogesh_Test',
            module: 'cd',
            templateType: 'Stage'
          }}
        >
          <StageTemplateCanvasWithRef />
        </TestWrapper>
      </PipelineContext.Provider>
    )
    expect(container).toMatchSnapshot()
    expect(context.setSelection).toBeCalled()
  })
})
