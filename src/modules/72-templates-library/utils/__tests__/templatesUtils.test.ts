/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { unset } from 'lodash-es'
import type { StringKeys } from 'framework/strings'
import { stageTemplateMock } from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import { getAllowedTemplateTypes, getVersionLabelText } from '@templates-library/utils/templatesUtils'

function getString(key: StringKeys): StringKeys {
  return key
}

describe('templatesUtils tests', () => {
  test('Test getVersionLabelText method', () => {
    expect(getVersionLabelText(stageTemplateMock, getString)).toEqual('v1')
    expect(getVersionLabelText({ ...stageTemplateMock, stableTemplate: true }, getString)).toEqual(
      'templatesLibrary.stableVersion'
    )
    unset(stageTemplateMock, 'versionLabel')
    expect(getVersionLabelText(stageTemplateMock, getString)).toEqual('templatesLibrary.alwaysUseStableVersion')
  })

  test('Test getAllowedTemplateTypes method', () => {
    expect(getAllowedTemplateTypes(getString, 'cd', true)).toEqual([
      { disabled: false, label: 'step', value: 'Step' },
      { disabled: false, label: 'common.stage', value: 'Stage' },
      { disabled: false, label: 'common.pipeline', value: 'Pipeline' },
      { disabled: true, label: 'service', value: 'Service' },
      { disabled: true, label: 'infrastructureText', value: 'Infrastructure' },
      { disabled: true, label: 'stepGroup', value: 'StepGroup' },
      { disabled: true, label: 'executionText', value: 'Execution' }
    ])
    expect(getAllowedTemplateTypes(getString, 'cv', false)).toEqual(
      expect.arrayContaining([
        {
          disabled: false,
          label: 'connectors.cdng.monitoredService.label',
          value: 'MonitoredService'
        }
      ])
    )
  })
})
