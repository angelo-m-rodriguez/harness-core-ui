/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as Yup from 'yup'
import type { UseStringsReturn } from 'framework/strings'
import type { HealthSource } from 'services/cv'
import { Connectors } from '@connectors/constants'
import { HealthSourceTypes } from '@cv/pages/health-source/types'
import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import { GCOProduct } from '@cv/pages/health-source/connectors/GCOLogsMonitoringSource/GoogleCloudOperationsMonitoringSourceUtils'
import { PrometheusProductNames } from '@cv/pages/health-source/connectors/PrometheusHealthSource/PrometheusHealthSource.constants'
import { DatadogProduct } from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.utils'
import { ErrorTrackingProductNames } from '@cv/pages/health-source/connectors/ErrorTrackingHealthSource/ErrorTrackingHealthSource.utils'
import { CustomHealthProduct } from '@cv/pages/health-source/connectors/CustomHealthSource/CustomHealthSource.constants'
import {
  NewRelicProductNames,
  ConnectorRefFieldName,
  SplunkProduct,
  DynatraceProductNames
} from './DefineHealthSource.constant'
import type { DefineHealthSourceFormInterface } from './DefineHealthSource.types'

export const validate = (getString: UseStringsReturn['getString']) => {
  return Yup.object().shape({
    sourceType: Yup.string().trim().required(getString('cv.onboarding.selectProductScreen.validationText.source')),
    healthSourceName: Yup.string().trim().required(getString('cv.onboarding.selectProductScreen.validationText.name')),
    product: Yup.string()
      .trim()
      .required()
      .notOneOf(['Custom Connector'], getString('cv.onboarding.selectProductScreen.validationText.product')),
    [ConnectorRefFieldName]: Yup.string()
      .nullable()
      .required(getString('cv.onboarding.selectProductScreen.validationText.connectorRef'))
  })
}

export const validateDuplicateIdentifier = (values: DefineHealthSourceFormInterface): any => {
  const { healthSourceIdentifier, healthSourceList } = values
  if (healthSourceList?.some(item => item.identifier === healthSourceIdentifier)) {
    return { healthSourceName: 'identifier already exist' }
  }
}

export const getFeatureOption = (type: string, getString: UseStringsReturn['getString']): SelectOption[] => {
  switch (type) {
    case Connectors.APP_DYNAMICS:
      return [
        {
          value: 'Application Monitoring',
          label: getString('cv.monitoringSources.appD.product.applicationMonitoring')
        }
      ]
    case Connectors.GCP:
      return [
        {
          value: GCOProduct.CLOUD_METRICS,
          label: getString('cv.monitoringSources.gco.product.metrics')
        },
        {
          value: GCOProduct.CLOUD_LOGS,
          label: getString('cv.monitoringSources.gco.product.logs')
        }
      ]
    case Connectors.DATADOG:
      return [
        {
          value: DatadogProduct.CLOUD_METRICS,
          label: getString('cv.monitoringSources.gco.product.metrics')
        },
        {
          value: DatadogProduct.CLOUD_LOGS,
          label: getString('cv.monitoringSources.gco.product.logs')
        }
      ]
    case HealthSourceTypes.StackdriverLog:
      return [
        {
          value: GCOProduct.CLOUD_LOGS,
          label: getString('cv.monitoringSources.gco.product.logs')
        }
      ]
    case Connectors.PROMETHEUS:
      return [
        {
          label: PrometheusProductNames.APM,
          value: getString('connectors.prometheusLabel')
        }
      ]
    case Connectors.NEW_RELIC:
      return [
        {
          value: NewRelicProductNames.APM,
          label: getString('connectors.newRelic.products.fullStackObservability')
        }
      ]
    case Connectors.DYNATRACE:
      return [
        {
          value: DynatraceProductNames.APM,
          label: getString('connectors.newRelic.products.fullStackObservability')
        }
      ]
    case Connectors.SPLUNK:
      return [
        {
          value: SplunkProduct.SPLUNK_LOGS,
          label: getString('cv.monitoringSources.gco.product.logs')
        }
      ]
    case Connectors.CUSTOM_HEALTH:
      return [
        {
          label: getString('cv.customHealthSource.customHealthMetric'),
          value: CustomHealthProduct.METRICS
        },
        {
          label: getString('cv.customHealthSource.customHealthLog'),
          value: CustomHealthProduct.LOGS
        }
      ]
    case Connectors.ERROR_TRACKING:
      return [
        {
          value: ErrorTrackingProductNames.LOGS,
          label: getString('cv.monitoringSources.gco.product.logs')
        }
      ]
    default:
      return []
  }
}

export function getProductBasedOnType(
  getString: UseStringsReturn['getString'],
  type?: HealthSource['type'],
  currProduct?: SelectOption
): SelectOption | undefined {
  switch (type) {
    case 'CustomHealthLog':
      return getFeatureOption(Connectors.CUSTOM_HEALTH, getString)[1]
    case 'CustomHealthMetric':
      return getFeatureOption(Connectors.CUSTOM_HEALTH, getString)[0]
    default:
      return { ...currProduct } as SelectOption
  }
}

export const getInitialValues = (sourceData: any, getString: UseStringsReturn['getString']): any => {
  const currentHealthSource = sourceData?.healthSourceList?.find(
    (el: any) => el?.identifier === sourceData?.healthSourceIdentifier
  )
  const selectedFeature = currentHealthSource?.spec?.feature
  const initialValues = {
    [ConnectorRefFieldName]: '',
    ...sourceData,
    product: selectedFeature
      ? { label: selectedFeature, value: selectedFeature }
      : getProductBasedOnType(getString, currentHealthSource?.type, sourceData?.product)
  }
  return initialValues
}

export const getSelectedFeature = (sourceData: any): any => {
  const currentHealthSource = sourceData?.healthSourceList?.find(
    (el: any) => el?.identifier === sourceData?.healthSourceIdentifier
  )
  const selectedFeature = currentHealthSource?.spec?.feature

  return selectedFeature ? { label: selectedFeature, value: selectedFeature } : { ...sourceData?.product }
}

export const modifyCustomHealthFeatureBasedOnFF = (
  isCustomLogEnabled: boolean,
  isCustomMetricEnabled: boolean,
  customHealthOptions: SelectOption[]
): SelectOption[] => {
  const featureOptionForConnector = []
  if (isCustomMetricEnabled) {
    featureOptionForConnector.push(customHealthOptions[0])
  }

  if (isCustomLogEnabled) {
    featureOptionForConnector.push(customHealthOptions[1])
  }

  return featureOptionForConnector
}
