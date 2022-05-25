/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Connectors } from '@connectors/constants'
import { getConnectorIconByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { HealthSourceTypes } from '@cv/pages/health-source/types'

export const HEALTHSOURCE_LIST = [
  {
    name: HealthSourceTypes.AppDynamics,
    icon: getConnectorIconByType(Connectors.APP_DYNAMICS)
  },
  {
    name: HealthSourceTypes.GoogleCloudOperations,
    icon: 'service-stackdriver'
  },
  {
    name: HealthSourceTypes.Prometheus,
    icon: getConnectorIconByType(Connectors.PROMETHEUS)
  },
  {
    name: HealthSourceTypes.NewRelic,
    icon: getConnectorIconByType(Connectors.NEW_RELIC)
  },
  {
    name: HealthSourceTypes.Splunk,
    icon: getConnectorIconByType(Connectors.SPLUNK)
  },
  {
    name: HealthSourceTypes.Datadog,
    icon: getConnectorIconByType(Connectors.DATADOG)
  },
  {
    name: HealthSourceTypes.Dynatrace,
    icon: getConnectorIconByType(Connectors.DYNATRACE)
  },
  {
    name: HealthSourceTypes.CustomHealth,
    icon: getConnectorIconByType(Connectors.CUSTOM_HEALTH)
  },
  {
    name: HealthSourceTypes.ErrorTracking,
    icon: getConnectorIconByType(Connectors.ERROR_TRACKING)
  }
]

export const NewRelicProductNames = {
  APM: 'apm'
}

export const DynatraceProductNames = {
  APM: 'dynatrace_apm'
}

export const SplunkProduct = {
  SPLUNK_LOGS: 'Splunk Cloud Logs',
  //  feature: Splunk Metric --> from Kamal's YAML
  SPLUNK_METRICS: 'Splunk Metric'
}

export const ConnectorRefFieldName = 'connectorRef'
