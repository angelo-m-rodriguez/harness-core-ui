import React, { useState } from 'react'
import { Container, Formik, FormikForm, Utils } from '@wings-software/uicore'
import { SetupSourceCardHeader } from '@cv/components/CVSetupSourcesView/SetupSourceCardHeader/SetupSourceCardHeader'
import { FooterCTA, SetupSourceLayout } from '@cv/components/CVSetupSourcesView/SetupSourceLayout/SetupSourceLayout'
import { useStrings } from 'framework/strings'
import { MultiItemsSideNav } from '@cv/components/MultiItemsSideNav/MultiItemsSideNav'
import { updateSelectedMetricsMap, validateMappings } from './utils'
import { initialFormData } from './constants'
import MapQueriesToHarnessServiceLayout from './components/MapGCPLogsQueriesToService/components/MapQueriesToHarnessServiceLayout/MapQueriesToHarnessServiceLayout'
import type { MapGCOLogsQueryToService, MapQueriesToHarnessServiceProps } from './types'
import css from './MapQueriesToHarnessService.module.scss'

export function MapQueriesToHarnessService(props: MapQueriesToHarnessServiceProps): JSX.Element {
  const { getString } = useStrings()
  const { onPrevious, onNext, data: sourceData } = props

  const [{ selectedMetric, mappedMetrics }, setMappedMetrics] = useState<{
    selectedMetric: string
    mappedMetrics: Map<string, MapGCOLogsQueryToService>
  }>({
    selectedMetric:
      (Array.from(sourceData?.mappedServicesAndEnvs?.keys() || [])?.[0] as string) ||
      getString('cv.monitoringSources.gcoLogs.gcoLogsQuery'),
    mappedMetrics:
      sourceData?.mappedServicesAndEnvs?.size > 0
        ? sourceData?.mappedServicesAndEnvs
        : new Map<string, MapGCOLogsQueryToService>([
            [getString('cv.monitoringSources.gcoLogs.gcoLogsQuery'), initialFormData]
          ])
  })

  const [{ createdMetrics, selectedMetricIndex }, setCreatedMetrics] = useState({
    createdMetrics: Array.from(mappedMetrics.keys()) || [getString('cv.monitoringSources.gcoLogs.gcoLogsQuery')],
    selectedMetricIndex: Array.from(mappedMetrics.keys()).findIndex(metric => metric === selectedMetric)
  })

  const connectorIdentifier = sourceData?.connectorRef?.value
  const [rerenderKey, setRerenderKey] = useState('')

  return (
    <Formik<MapGCOLogsQueryToService | undefined>
      onSubmit={updatedSource => {
        if (updatedSource) {
          mappedMetrics.set(selectedMetric, updatedSource)
        }
        onNext({ ...sourceData, mappedServicesAndEnvs: new Map(mappedMetrics) })
      }}
      formName="mapGCOLogs"
      initialValues={mappedMetrics.get(selectedMetric || '')}
      key={rerenderKey}
      isInitialValid={(args: any) => {
        return (
          Object.keys(validateMappings(getString, createdMetrics, selectedMetricIndex, args.initialValues)).length === 0
        )
      }}
      enableReinitialize={true}
      validate={values => {
        return validateMappings(getString, createdMetrics, selectedMetricIndex, values)
      }}
    >
      {formikProps => (
        <FormikForm>
          <SetupSourceLayout
            leftPanelContent={
              <MultiItemsSideNav
                defaultMetricName={getString('cv.monitoringSources.gcoLogs.gcoLogsQuery')}
                tooptipMessage={getString('cv.monitoringSources.gcoLogs.addQueryTooltip')}
                addFieldLabel={getString('cv.monitoringSources.addQuery')}
                createdMetrics={createdMetrics}
                defaultSelectedMetric={selectedMetric}
                renamedMetric={formikProps.values?.metricName}
                onRemoveMetric={(removedMetric, updatedMetric, updatedList, smIndex) => {
                  setMappedMetrics(oldState => {
                    const { selectedMetric: oldMetric, mappedMetrics: oldMappedMetric } = oldState
                    const updatedMap = new Map(oldMappedMetric)

                    if (updatedMap.has(removedMetric)) {
                      updatedMap.delete(removedMetric)
                    } else {
                      // handle case where user updates the metric name for current selected metric
                      updatedMap.delete(oldMetric)
                    }

                    // update map with current values
                    if (formikProps.values?.metricName !== removedMetric) {
                      updatedMap.set(
                        updatedMetric,
                        { ...(formikProps.values as MapGCOLogsQueryToService) } || { metricName: updatedMetric }
                      )
                    } else {
                      setRerenderKey(Utils.randomId())
                    }

                    setCreatedMetrics({ selectedMetricIndex: smIndex, createdMetrics: updatedList })
                    return { selectedMetric: updatedMetric, mappedMetrics: updatedMap }
                  })
                }}
                onSelectMetric={(newMetric, updatedList, smIndex) => {
                  setCreatedMetrics({ selectedMetricIndex: smIndex, createdMetrics: updatedList })
                  setMappedMetrics((oldState: any) => {
                    return updateSelectedMetricsMap({
                      updatedMetric: newMetric,
                      oldMetric: oldState.selectedMetric,
                      mappedMetrics: new Map<string, MapGCOLogsQueryToService>(oldState.mappedMetrics),
                      formikProps
                    })
                  })
                  setRerenderKey(Utils.randomId())
                }}
                isValidInput={formikProps.isValid}
              />
            }
            content={
              <Container className={css.main}>
                <SetupSourceCardHeader
                  mainHeading={getString('cv.monitoringSources.gcoLogs.querySpecificationsAndMappings')}
                  subHeading={getString('cv.monitoringSources.gcoLogs.customizeQuery')}
                />
                <MapQueriesToHarnessServiceLayout
                  onChange={formikProps.setFieldValue}
                  formikProps={formikProps}
                  connectorIdentifier={connectorIdentifier}
                />
              </Container>
            }
          />
          <FooterCTA onPrevious={onPrevious} onNext={formikProps.submitForm} />
        </FormikForm>
      )}
    </Formik>
  )
}
