/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
// eslint-disable-next-line no-restricted-imports
import { ConfigurationsWithRef } from '@cv/pages/monitored-service/components/Configurations/ConfigurationsRef'
import type { NGTemplateInfoConfigWithMonitoredService } from '@templates-library/components/Templates/MonitoredServiceTemplate/MonitoredServiceTemplate'
import { TemplateContext } from '../TemplateContext/TemplateContext'
import type { TemplateFormRef } from '../TemplateStudio'

const MonitoredServiceTemplateCanvas = (_props: unknown, formikRef: TemplateFormRef) => {
  const { updateTemplate } = React.useContext(TemplateContext)
  return (
    <ConfigurationsWithRef
      isTemplate={true}
      ref={formikRef}
      updateTemplate={updateTemplate as (template: NGTemplateInfoConfigWithMonitoredService) => Promise<void>}
    />
  )
}

export const MonitoredTemplateCanvasWithRef = React.forwardRef(MonitoredServiceTemplateCanvas)
