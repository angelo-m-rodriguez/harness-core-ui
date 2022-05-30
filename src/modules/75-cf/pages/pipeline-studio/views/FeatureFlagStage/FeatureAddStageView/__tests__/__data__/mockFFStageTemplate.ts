/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { TemplateSummaryResponse } from 'services/template-ng'

const mockFFStageTemplate: TemplateSummaryResponse = {
  accountId: 'zEaak-FLS425IEO7OLzMUg',
  orgIdentifier: 'default',
  projectIdentifier: 'chris_test_4',
  identifier: 'tempalte_2',
  name: 'tempalte_2',
  description: '',
  tags: {},
  yaml: 'template:\n    name: tempalte_2\n    identifier: tempalte_2\n    versionLabel: v1\n    type: Stage\n    projectIdentifier: chris_test_4\n    orgIdentifier: default\n    tags: {}\n    spec:\n        type: FeatureFlag\n        spec:\n            execution:\n                steps:\n                    - step:\n                          type: FlagConfiguration\n                          name: flip_flips\n                          identifier: flip_flips\n                          spec:\n                              feature: test111\n                              environment: test\n                              instructions:\n                                  - identifier: SetFeatureFlagStateIdentifier\n                                    type: SetFeatureFlagState\n                                    spec:\n                                        state: "on"\n                                  - identifier: SetDefaultVariationsIdentifier\n                                    type: SetDefaultVariations\n                          timeout: 10m\n                          failureStrategies: []\n            serviceDependencies: []\n',
  versionLabel: 'v1',
  templateEntityType: 'Stage',
  childType: 'FeatureFlag',
  templateScope: 'project',
  version: 2,
  gitDetails: {
    objectId: '',
    branch: '',
    repoIdentifier: '',
    rootFolder: '',
    filePath: '',
    repoName: ''
  },
  entityValidityDetails: {
    valid: true,
    invalidYaml: undefined
  },
  lastUpdatedAt: 1653472834917,
  createdAt: 1652956333083,
  stableTemplate: true
}

export default mockFFStageTemplate
