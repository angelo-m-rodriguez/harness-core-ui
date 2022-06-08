/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { Container, FormInput, MultiSelectOption, Text } from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import type { FormikProps } from 'formik'
import type { FilterStatsDTO } from 'services/ce'
import { useStrings } from 'framework/strings'
import type { RecommendationFilterFormType } from './FilterDrawer'

import css from '../RecommendationFilters.module.scss'

interface RecommendationFilterFormProps {
  formikProps?: FormikProps<RecommendationFilterFormType>
  fetchedFilterValues: FilterStatsDTO[]
}

const RecommendationFilterForm: React.FC<RecommendationFilterFormProps> = ({ fetchedFilterValues }) => {
  const { getString } = useStrings()

  const getItemsFromFilterValues = useCallback(
    (key: string): MultiSelectOption[] => {
      const options: MultiSelectOption[] = []

      fetchedFilterValues
        .find(filter => filter.key === key)
        ?.values?.map(val => {
          if (val) {
            options.push({ label: val, value: val })
          }
        })

      return options
    },
    [fetchedFilterValues]
  )

  return (
    <Container width={350}>
      <Text className={css.label} font={{ variation: FontVariation.BODY2 }}>
        {getString('ce.recommendation.listPage.filters.resourceName')}
      </Text>
      <FormInput.MultiSelect name="names" key="names" items={getItemsFromFilterValues('name')} />
      <Text className={css.label} font={{ variation: FontVariation.BODY2 }}>
        {getString('ce.recommendation.listPage.filters.namespace')}
      </Text>
      <FormInput.MultiSelect name="namespaces" key="namespaces" items={getItemsFromFilterValues('namespace')} />
      <Text className={css.label} font={{ variation: FontVariation.BODY2 }}>
        {getString('ce.recommendation.listPage.filters.clusterName')}
      </Text>
      <FormInput.MultiSelect name="clusterNames" key="clusterNames" items={getItemsFromFilterValues('clusterName')} />
      <Text className={css.label} font={{ variation: FontVariation.BODY2 }}>
        {getString('common.resourceTypeLabel')}
      </Text>
      <FormInput.MultiSelect
        name="resourceTypes"
        key="resourceTypes"
        items={getItemsFromFilterValues('resourceType')}
      />
      <Text className={css.label} font={{ variation: FontVariation.BODY2 }}>
        {getString('ce.recommendation.listPage.filters.potentialSpend')}
      </Text>
      <FormInput.Text
        name="minCost"
        key="minCost"
        placeholder={getString('ce.recommendation.listPage.filters.spendPlaceholder')}
      />
      <Text className={css.label} font={{ variation: FontVariation.BODY2 }}>
        {getString('ce.recommendation.listPage.filters.savings')}
      </Text>
      <FormInput.Text
        name="minSaving"
        key="minSaving"
        placeholder={getString('ce.recommendation.listPage.filters.savingsPlaceholder')}
      />
    </Container>
  )
}

export default RecommendationFilterForm
