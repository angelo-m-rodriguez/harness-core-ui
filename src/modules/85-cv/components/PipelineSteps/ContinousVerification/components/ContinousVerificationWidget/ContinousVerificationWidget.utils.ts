/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import type { FormikErrors } from 'formik'
import type { StringKeys } from 'framework/strings'
import type { ContinousVerificationData } from '../../types'
import { MONITORED_SERVICE_EXPRESSION } from './components/ContinousVerificationWidgetSections/components/MonitoredService/MonitoredService.constants'

export function healthSourcesValidation(
  monitoredServiceRef: string | undefined,
  healthSources: { identifier: string }[] | undefined,
  spec: any,
  getString: (key: StringKeys) => string,
  errors: FormikErrors<ContinousVerificationData>
): any {
  if (
    monitoredServiceRef !== RUNTIME_INPUT_VALUE &&
    monitoredServiceRef !== MONITORED_SERVICE_EXPRESSION &&
    monitoredServiceRef &&
    !healthSources?.length
  ) {
    spec = {
      ...spec,
      healthSources: getString('connectors.cdng.validations.healthSourceRequired')
    }
    errors['spec'] = spec
  }
  return spec
}

export function monitoredServiceRefValidation(
  monitoredServiceRef: string | undefined,
  spec: any,
  errors: FormikErrors<ContinousVerificationData>
): any {
  if (!monitoredServiceRef) {
    spec = {
      ...spec,
      monitoredServiceRef: 'Monitored service is required'
    }
    errors['spec'] = spec
  }
  return spec
}
