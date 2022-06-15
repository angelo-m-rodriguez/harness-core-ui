/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useContext, useMemo } from 'react'
import { Container, Formik, FormikForm, Layout, SelectOption, Utils, Accordion } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { noop } from 'lodash-es'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { GroupName } from '@cv/pages/health-source/common/GroupName/GroupName'
import { SetupSourceCardHeader } from '@cv/components/CVSetupSourcesView/SetupSourceCardHeader/SetupSourceCardHeader'
import DrawerFooter from '@cv/pages/health-source/common/DrawerFooter/DrawerFooter'
import { StackdriverDefinition, useGetLabelNames, useGetMetricPacks } from 'services/cv'
import { useStrings } from 'framework/strings'
import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import useGroupedSideNaveHook from '@cv/hooks/GroupedSideNaveHook/useGroupedSideNaveHook'
import {
  validateMappings,
  transformPrometheusSetupSourceToHealthSource,
  transformPrometheusHealthSourceToSetupSource
} from './SplunkMetricsHealthSource.utils'
import {
  PrometheusMonitoringSourceFieldNames,
  MapSplunkMetricQueryToService,
  PrometheusSetupSource
} from './SplunkMetricsHealthSource.constants'
import { initializeGroupNames } from '../../common/GroupName/GroupName.utils'
import CustomMetric from '../../common/CustomMetric/CustomMetric'
import type { UpdatedHealthSource } from '../../HealthSourceDrawer/HealthSourceDrawerContent.types'
import SelectHealthSourceServices from '../../common/SelectHealthSourceServices/SelectHealthSourceServices'
import SplunkMetricsQueryViewer from './components/SplunkMetricsQueryViewer/SplunkMetricsQueryViewer'
import css from './SplunkMetricsHealthSource.module.scss'

export interface SplunkMetricsHealthSourceProps {
  data: any
  onSubmit: (formdata: PrometheusSetupSource, UpdatedHealthSource: UpdatedHealthSource) => Promise<void>
}

export function SplunkMetricsHealthSource(props: SplunkMetricsHealthSourceProps): JSX.Element {
  const { data: sourceData, onSubmit } = props

  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps & { identifier: string }>()

  const {
    onPrevious,
    sourceData: { existingMetricDetails }
  } = useContext(SetupSourceTabsContext)

  const metricDefinitions = existingMetricDetails?.spec?.metricDefinitions

  const { getString } = useStrings()

  const connectorIdentifier = sourceData?.connectorRef || ''
  const [labelNameTracingId] = useMemo(() => [Utils.randomId(), Utils.randomId()], [])
  const metricPackResponse = useGetMetricPacks({
    queryParams: { projectIdentifier, orgIdentifier, accountId, dataSourceType: 'PROMETHEUS' }
  })
  const labelNamesResponse = useGetLabelNames({
    queryParams: { projectIdentifier, orgIdentifier, accountId, connectorIdentifier, tracingId: labelNameTracingId }
  })

  const transformedSourceData = useMemo(
    () => transformPrometheusHealthSourceToSetupSource(sourceData, getString),
    [sourceData]
  )

  const {
    createdMetrics,
    mappedMetrics,
    selectedMetric,
    groupedCreatedMetrics,
    groupedCreatedMetricsList,
    setMappedMetrics,
    setCreatedMetrics,
    setGroupedCreatedMetrics
  } = useGroupedSideNaveHook({
    defaultCustomMetricName: getString('cv.monitoringSources.splunk.defaultSplunkMetricName'),
    initCustomMetricData: {},
    mappedServicesAndEnvs: transformedSourceData.mappedServicesAndEnvs
  })

  const [splunkGroupNames, setSplunkGroupName] = useState<SelectOption[]>(
    initializeGroupNames(mappedMetrics, getString)
  )

  const initialFormValues = mappedMetrics.get(selectedMetric || '') as MapSplunkMetricQueryToService

  return (
    <Formik<MapSplunkMetricQueryToService>
      formName="mapSplunkMetrics"
      initialValues={initialFormValues}
      isInitialValid={(args: any) =>
        Object.keys(
          validateMappings(
            getString,
            groupedCreatedMetricsList,
            groupedCreatedMetricsList.indexOf(selectedMetric),
            args.initialValues,
            mappedMetrics
          )
        ).length === 0
      }
      onSubmit={noop}
      enableReinitialize={true}
      validate={values => {
        return validateMappings(
          getString,
          groupedCreatedMetricsList,
          groupedCreatedMetricsList.indexOf(selectedMetric),
          values,
          mappedMetrics
        )
      }}
    >
      {formikProps => {
        const currentSelectedMetricDetail = metricDefinitions?.find(
          (metricDefinition: StackdriverDefinition) =>
            metricDefinition.metricName === mappedMetrics.get(selectedMetric || '')?.metricName
        )

        if (!formikProps.touched?.identifier) {
          formikProps.setTouched({
            ...formikProps.touched,
            [PrometheusMonitoringSourceFieldNames.METRIC_IDENTIFIER]: true,
            [PrometheusMonitoringSourceFieldNames.METRIC_NAME]: true
          })
        }

        return (
          <FormikForm>
            <CustomMetric
              isPrimaryMetric
              isValidInput={formikProps.isValid}
              setMappedMetrics={setMappedMetrics}
              selectedMetric={selectedMetric}
              formikValues={formikProps.values as any}
              mappedMetrics={mappedMetrics}
              createdMetrics={createdMetrics}
              setCreatedMetrics={setCreatedMetrics}
              defaultMetricName={getString('cv.monitoringSources.splunk.defaultSplunkMetricName')}
              tooptipMessage={getString('cv.monitoringSources.gcoLogs.addQueryTooltip')}
              addFieldLabel={getString('cv.monitoringSources.addMetric')}
              initCustomForm={
                {
                  query: '',
                  groupName: { label: '', value: '' },
                  isManualQuery: false
                } as any
              }
              groupedCreatedMetrics={groupedCreatedMetrics}
              setGroupedCreatedMetrics={setGroupedCreatedMetrics}
            >
              <Container className={css.main}>
                <SetupSourceCardHeader
                  mainHeading={getString('cv.monitoringSources.prometheus.querySpecificationsAndMappings')}
                  subHeading={getString('cv.monitoringSources.prometheus.customizeQuery')}
                />
                <Layout.Horizontal className={css.content} spacing="xlarge">
                  <Accordion activeId="metricToService" className={css.accordian}>
                    <Accordion.Panel
                      id="metricToService"
                      summary={getString('cv.monitoringSources.mapMetricsToServices')}
                      details={
                        <>
                          <NameId
                            nameLabel={getString('cv.monitoringSources.metricNameLabel')}
                            identifierProps={{
                              inputName: PrometheusMonitoringSourceFieldNames.METRIC_NAME,
                              idName: PrometheusMonitoringSourceFieldNames.METRIC_IDENTIFIER,
                              isIdentifierEditable: Boolean(!currentSelectedMetricDetail?.identifier)
                            }}
                          />
                          <GroupName
                            groupNames={splunkGroupNames}
                            onChange={formikProps.setFieldValue}
                            item={formikProps.values?.groupName}
                            setGroupNames={setSplunkGroupName}
                          />
                        </>
                      }
                    />
                    <Accordion.Panel
                      id="assign"
                      summary={getString('cv.monitoringSources.assign')}
                      details={
                        <SelectHealthSourceServices
                          values={{
                            sli: !!formikProps?.values?.sli
                          }}
                          hideCV
                          hideSLIAndHealthScore
                          hideServiceIdentifier
                          showOnlySLI
                          metricPackResponse={metricPackResponse}
                          labelNamesResponse={labelNamesResponse}
                        />
                      }
                    />
                  </Accordion>
                  <SplunkMetricsQueryViewer
                    connectorIdentifier={sourceData?.connectorRef}
                    onChange={formikProps.setFieldValue}
                    formikProps={formikProps}
                  />
                </Layout.Horizontal>
              </Container>
            </CustomMetric>
            <DrawerFooter
              isSubmit
              onPrevious={onPrevious}
              onNext={async () => {
                formikProps.setTouched({
                  ...formikProps.touched,

                  [PrometheusMonitoringSourceFieldNames.GROUP_NAME]: true,
                  [PrometheusMonitoringSourceFieldNames.SLI]: true,
                  [PrometheusMonitoringSourceFieldNames.METRIC_IDENTIFIER]: true,
                  [PrometheusMonitoringSourceFieldNames.METRIC_NAME]: true,
                  [PrometheusMonitoringSourceFieldNames.QUERY]: true
                })

                if (Object.keys(formikProps.errors || {})?.length > 0) {
                  formikProps.validateForm()
                  return
                }
                const updatedMetric = formikProps.values
                if (updatedMetric) {
                  mappedMetrics.set(selectedMetric, updatedMetric)
                }
                await onSubmit(
                  sourceData,
                  transformPrometheusSetupSourceToHealthSource({
                    ...transformedSourceData,
                    mappedServicesAndEnvs: mappedMetrics as Map<string, MapSplunkMetricQueryToService>
                  })
                )
              }}
            />
          </FormikForm>
        )
      }}
    </Formik>
  )
}
