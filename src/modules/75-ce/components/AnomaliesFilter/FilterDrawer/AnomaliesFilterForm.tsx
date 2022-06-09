/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { Container, FormInput, MultiSelectOption, Card, Icon, Layout, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import { useBooleanStatus } from '@common/hooks'
import type { FilterStatsDTO } from 'services/ce'
import type { CcmMetaData } from 'services/ce/services'
import {
  awsFilterKeys,
  azureFilterKeys,
  filterKeyToKeyMapping,
  filterKeyToLabelMapping,
  gcpFilterKeys,
  k8sFilterKeys
} from '@ce/utils/anomaliesUtils'
import type { AnomaliesFilterFormType } from './FilterDrawer'

import css from './AnomalyFilterForm.module.scss'

interface AnomaliesFilterFormProps {
  formikProps?: FormikProps<AnomaliesFilterFormType>
  fetchedFilterValues: FilterStatsDTO[]
  ccmMetaData: CcmMetaData
}

const AnomaliesFilterForm: React.FC<AnomaliesFilterFormProps> = ({ fetchedFilterValues, formikProps, ccmMetaData }) => {
  const { getString } = useStrings()

  const getItemsFromFilterValues = useCallback(
    (key: string): MultiSelectOption[] => {
      const options: MultiSelectOption[] = []

      fetchedFilterValues
        .find(filter => filter.key === filterKeyToKeyMapping[key])
        ?.values?.map(val => {
          if (val) {
            options.push({ label: val, value: val })
          }
        })

      return options
    },
    [fetchedFilterValues]
  )

  const getSelectedFiltersCount = (keys: string[]): number => {
    let count = 0

    keys.map(key => {
      if (formikProps?.values[key as keyof AnomaliesFilterFormType]) {
        count += 1
      }
    })

    return count
  }

  const { state: isAwsCardVisible, toggle: toggleAwsCard } = useBooleanStatus()
  const { state: isGcpCardVisible, toggle: toggleGcpCard } = useBooleanStatus()
  const { state: isK8sCardVisible, toggle: toggleK8sCard } = useBooleanStatus()
  const { state: isAzureCardVisible, toggle: toggleAzureCard } = useBooleanStatus()

  return (
    <Container className={css.anomalyFilterForm}>
      <Text padding={{ bottom: 'small' }} color={Color.GREY_700} font={{ variation: FontVariation.BODY2 }}>
        {getString('ce.anomalyDetection.filters.actualSpend')}
      </Text>
      <FormInput.Text
        name="minActualAmount"
        key="minActualAmount"
        placeholder={getString('ce.anomalyDetection.filters.spendPlaceholder')}
      />
      <Text padding={{ bottom: 'small' }} color={Color.GREY_700} font={{ variation: FontVariation.BODY2 }}>
        {getString('ce.anomalyDetection.filters.anomalousSpend')}
      </Text>
      <FormInput.Text
        name="minAnomalousSpend"
        key="minAnomalousSpend"
        placeholder={getString('ce.anomalyDetection.filters.spendPlaceholder')}
      />
      {ccmMetaData.defaultClusterPerspectiveId ? (
        <CloudProviderFilterCard
          visible={isK8sCardVisible}
          toggleCard={toggleK8sCard}
          filterKeys={k8sFilterKeys}
          getItemsFromFilterValues={getItemsFromFilterValues}
          header={getString('ce.anomalyDetection.filters.clusterFilters')}
          getSelectedFiltersCount={getSelectedFiltersCount}
        />
      ) : null}
      {ccmMetaData.defaultGcpPerspectiveId ? (
        <CloudProviderFilterCard
          visible={isGcpCardVisible}
          toggleCard={toggleGcpCard}
          filterKeys={gcpFilterKeys}
          getItemsFromFilterValues={getItemsFromFilterValues}
          header={getString('ce.anomalyDetection.filters.gcpFilters')}
          getSelectedFiltersCount={getSelectedFiltersCount}
        />
      ) : null}
      {ccmMetaData.defaultAwsPerspectiveId ? (
        <CloudProviderFilterCard
          visible={isAwsCardVisible}
          toggleCard={toggleAwsCard}
          filterKeys={awsFilterKeys}
          getItemsFromFilterValues={getItemsFromFilterValues}
          header={getString('ce.anomalyDetection.filters.awsFilters')}
          getSelectedFiltersCount={getSelectedFiltersCount}
        />
      ) : null}
      {ccmMetaData.defaultAzurePerspectiveId ? (
        <CloudProviderFilterCard
          visible={isAzureCardVisible}
          toggleCard={toggleAzureCard}
          filterKeys={azureFilterKeys}
          getItemsFromFilterValues={getItemsFromFilterValues}
          header={getString('ce.anomalyDetection.filters.azureFilters')}
          getSelectedFiltersCount={getSelectedFiltersCount}
        />
      ) : null}
    </Container>
  )
}

export default AnomaliesFilterForm

interface CloudProviderFilterCardProps {
  visible: boolean
  toggleCard: () => void
  getItemsFromFilterValues: (key: string) => MultiSelectOption[]
  filterKeys: string[]
  header: string
  getSelectedFiltersCount: (filterKeys: string[]) => number
}

const CloudProviderFilterCard: React.FC<CloudProviderFilterCardProps> = ({
  visible,
  toggleCard,
  getItemsFromFilterValues,
  filterKeys,
  header,
  getSelectedFiltersCount
}) => {
  const selectedFiltersCount = getSelectedFiltersCount(filterKeys)

  return (
    <Card style={{ width: '100%' }} className={cx(css.filterCard, { [css.expanded]: visible })}>
      <Layout.Horizontal flex>
        <Layout.Horizontal spacing={'small'}>
          <Text color={Color.GREY_700} font={{ variation: FontVariation.BODY2 }}>
            {header}
          </Text>
          {selectedFiltersCount ? (
            <Text className={css.badge} font={{ variation: FontVariation.TINY }}>
              {selectedFiltersCount}
            </Text>
          ) : null}
        </Layout.Horizontal>
        <Icon
          name={visible ? 'chevron-up' : 'chevron-down'}
          onClick={toggleCard}
          className={css.pointer}
          color={Color.PRIMARY_7}
        />
      </Layout.Horizontal>
      {visible && (
        <Container className={css.cpFilters}>
          {filterKeys.map(key => {
            const selectOptions = getItemsFromFilterValues(key)

            return (
              <Container key={key}>
                <Text className={css.label} font={{ variation: FontVariation.SMALL }}>
                  {filterKeyToLabelMapping[key]}
                </Text>
                <FormInput.MultiSelect name={key} key={key} items={selectOptions} />
              </Container>
            )
          })}
        </Container>
      )}
    </Card>
  )
}
