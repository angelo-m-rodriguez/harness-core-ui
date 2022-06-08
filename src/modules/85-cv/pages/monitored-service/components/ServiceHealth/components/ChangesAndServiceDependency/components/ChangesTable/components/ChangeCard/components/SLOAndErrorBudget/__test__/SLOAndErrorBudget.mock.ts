/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { RestResponseListMonitoredServiceChangeDetailSLO } from 'services/cv'

export const monitoredServiceChangeDetailSLOResponse: RestResponseListMonitoredServiceChangeDetailSLO = {
  resource: [
    {
      name: 'SLO 1',
      identifier: 'SLO_1'
    },
    {
      name: 'SLO 2',
      identifier: 'SLO_2'
    },
    {
      name: 'SLO 3',
      identifier: 'SLO_3'
    },
    {
      name: 'SLO 4',
      identifier: 'SLO_4',
      outOfRange: true
    }
  ]
}
