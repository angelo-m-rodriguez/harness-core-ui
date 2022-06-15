/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FormInput, SelectOption } from '@wings-software/uicore'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import Card from '@cv/components/Card/Card'
import { monitoredServiceTypes } from './SelectMonitoredServiceType.constants'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export default function SelectMonitoredServiceType(): React.ReactElement {
  const { getString } = useStrings()

  return (
    <Card>
      <>
        <div className={cx(stepCss.formGroup)}>
          <FormInput.Select
            name="spec.monitoredService.type"
            label={getString('connectors.cdng.monitoredServiceType')}
            items={monitoredServiceTypes as SelectOption[]}
          />
        </div>
      </>
    </Card>
  )
}
