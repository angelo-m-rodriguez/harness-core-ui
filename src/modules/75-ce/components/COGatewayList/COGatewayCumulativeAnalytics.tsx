/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

// import { ProgressBar } from '@blueprintjs/core'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import { Container, HarnessDocTooltip, Icon, Layout, Text } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { String, useStrings } from 'framework/strings'
import { CumulativeSavings, FilterDTO, useCumulativeServiceSavingsV2 } from 'services/lw'
import { RulesMode } from '@ce/constants'
import EmptyView from '@ce/images/empty-state.svg'
import { getEmissionsValue } from '@ce/utils/formatResourceValue'
import greenLeaf from '@ce/common/images/green-leaf.svg'
import grayLeaf from '@ce/common/images/gray-leaf.svg'
import TimeRangePicker from '@ce/common/TimeRangePicker/TimeRangePicker'
import type { TimeRangeFilterType } from '@ce/types'
import { CE_DATE_FORMAT_INTERNAL, DATE_RANGE_SHORTCUTS } from '@ce/utils/momentUtils'
import { FeatureFlag } from '@common/featureFlags'
import { useToaster } from '@common/exports'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useDeepCompareEffect } from '@common/hooks'
import { Utils } from '@ce/common/Utils'
import { getFilterBodyFromFilterData } from './Utils'
import SpendVsSavingsChart from './SpendVsSavingsChart'
import SavingsPieChart from './SavingsPieChart'
import css from './COGatewayCumulativeAnalytics.module.scss'

interface COGatewayCumulativeAnalyticsProps {
  mode: RulesMode
  searchQuery?: string
  appliedFilter?: FilterDTO
}

function getSavingsPercentage(totalSavings: number, totalPotentialCost: number): number {
  if (totalPotentialCost == 0) {
    return 0
  }
  return Math.round((totalSavings / totalPotentialCost) * 100)
}
const COGatewayCumulativeAnalytics: React.FC<COGatewayCumulativeAnalyticsProps> = ({
  mode,
  searchQuery,
  appliedFilter
}) => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const { showError } = useToaster()
  const sustainabilityEnabled = useFeatureFlag(FeatureFlag.CCM_SUSTAINABILITY)

  const [data, setData] = useState<CumulativeSavings>()
  const [timeRange, setTimeRange] = useState<TimeRangeFilterType>({
    to: DATE_RANGE_SHORTCUTS.LAST_30_DAYS[1].format(CE_DATE_FORMAT_INTERNAL),
    from: DATE_RANGE_SHORTCUTS.LAST_30_DAYS[0].format(CE_DATE_FORMAT_INTERNAL)
  })

  const hasData = !_isEmpty(data)
  const isDryRunMode = mode === RulesMode.DRY

  const { mutate: fetchCumulativeSavings, loading: loadingData } = useCumulativeServiceSavingsV2({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  useDeepCompareEffect(() => {
    getSavingsData()
  }, [mode, searchQuery, timeRange.from, timeRange.to, appliedFilter?.data])

  const getSavingsData = async () => {
    try {
      const savingsResponse = await fetchCumulativeSavings({
        dry_run: isDryRunMode,
        query: searchQuery?.length ? searchQuery : undefined,
        from: timeRange.from,
        to: timeRange.to,
        filters: !_isEmpty(appliedFilter?.data)
          ? getFilterBodyFromFilterData(appliedFilter?.data as { [key: string]: any })
          : undefined
      })
      setData(savingsResponse.response as CumulativeSavings)
    } catch (error) {
      const errMessage = _defaultTo(error?.data?.errors?.join(', '), error?.message)
      showError(errMessage)
    }
  }

  return (
    <Container padding="small">
      <Layout.Vertical background={Color.WHITE} className={css.analyticsContainer} spacing="large">
        <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
          <Text font={{ variation: FontVariation.H6 }} data-tooltip-id="summaryOfRulesHeader">
            {getString('ce.co.summarySection.sectionHeader')}
            <HarnessDocTooltip tooltipId="summaryOfRulesHeader" useStandAlone={true} />
          </Text>
          <Container margin={{ right: 'xxxlarge' }}>
            <TimeRangePicker timeRange={timeRange} setTimeRange={setTimeRange} />
          </Container>
        </Layout.Horizontal>
        <Layout.Horizontal spacing="xxlarge">
          <Layout.Vertical style={{ flex: 1 }} flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Layout.Vertical spacing="small">
              <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_500}>
                {Utils.getConditionalResult(
                  isDryRunMode,
                  getString('ce.co.summarySection.dryRunSavingsPercentage'),
                  getString('ce.co.summarySection.savingsPercentage')
                )}
              </Text>
              <SavingsPieChart
                savingsPercentage={
                  hasData ? getSavingsPercentage(data?.total_savings as number, data?.total_potential as number) : 0
                }
                mode={mode}
              />
            </Layout.Vertical>
            <div style={{ paddingBottom: 'var(--spacing-large)' }}>
              <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_500}>
                {Utils.getConditionalResult(
                  isDryRunMode,
                  getString('ce.co.dryRunModeLabel'),
                  getString('ce.co.activeModeLabel')
                )}
              </Text>
              <Layout.Horizontal spacing="small">
                <Text font={{ variation: FontVariation.H2 }} color={Color.GREY_600}>
                  {_defaultTo(data?.total_active_services, 0)}
                </Text>
                <Text
                  font={{ variation: FontVariation.BODY2_SEMI }}
                  color={Color.GREY_600}
                  style={{ alignSelf: 'center' }}
                >
                  {getString('ce.co.rules')}
                </Text>
              </Layout.Horizontal>
            </div>
          </Layout.Vertical>
          <Layout.Vertical spacing="large" style={{ flex: 3, marginRight: 'var(--spacing-xxlarge)' }}>
            <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_500}>
              {Utils.getConditionalResult(
                isDryRunMode,
                getString('ce.co.summarySection.dryRunGraphHeader'),
                getString('ce.co.summarySection.graphHeader')
              )}
            </Text>
            <SpendVsSavingsChart
              data={data}
              loading={loadingData}
              mode={mode}
              timeRange={timeRange}
              searchTerm={searchQuery}
            />
          </Layout.Vertical>
          <Layout.Vertical
            spacing="small"
            style={{ flex: 1 }}
            flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div
              className={Utils.getConditionalResult(
                isDryRunMode,
                css.totalSavingsInfoCardDryRun,
                css.totalSavingsInfoCard
              )}
            >
              <Layout.Vertical spacing="small">
                <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_700}>
                  {Utils.getConditionalResult(
                    isDryRunMode,
                    getString('ce.co.summarySection.dryRunSavings'),
                    getString('ce.co.summarySection.totalSavings')
                  )}
                </Text>
                {loadingData ? (
                  <Icon name="spinner" size={24} color="blue500" />
                ) : (
                  <>
                    {hasData ? (
                      <Text font={{ variation: FontVariation.H2 }} color={Color.GREY_700}>
                        ${(Math.round(data?.total_savings as number) * 100) / 100}
                      </Text>
                    ) : (
                      <div>
                        <img src={EmptyView} />
                        <Text>{getString('ce.noSavingsDataMessage')}</Text>
                      </div>
                    )}
                  </>
                )}
              </Layout.Vertical>
            </div>
            <div
              className={Utils.getConditionalResult(isDryRunMode, css.totalSpendInfoCardDryRun, css.totalSpendInfoCard)}
              style={{ marginBottom: 'var(--spacing-large)' }}
            >
              <Layout.Vertical spacing="small">
                <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_500}>
                  {Utils.getConditionalResult(
                    isDryRunMode,
                    getString('ce.co.summarySection.dryRunSpend'),
                    getString('ce.co.summarySection.totalSpend')
                  )}
                </Text>
                {loadingData ? (
                  <Icon name="spinner" size={24} color="blue500" />
                ) : (
                  <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_500}>
                    ${(Math.round(data?.total_cost as number) * 100) / 100}
                  </Text>
                )}
              </Layout.Vertical>
            </div>
          </Layout.Vertical>
          {sustainabilityEnabled && (
            <Layout.Vertical
              spacing={'huge'}
              style={{ flex: 1 }}
              flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <Layout.Vertical spacing={'medium'}>
                <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'center' }} spacing="small">
                  <img src={greenLeaf} width={20} />
                  <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_500}>
                    {getString('ce.co.reducedEmissions')}
                  </Text>
                </Layout.Horizontal>
                <Text font={{ variation: FontVariation.H3 }}>
                  <String
                    stringID="ce.common.emissionUnitHTML"
                    useRichText
                    vars={{ value: getEmissionsValue(_defaultTo(data?.total_savings, 0)) }}
                  />
                </Text>
              </Layout.Vertical>
              <Layout.Vertical spacing={'medium'} style={{ paddingBottom: 'var(--spacing-large)' }}>
                <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'center' }} spacing="small">
                  <img src={grayLeaf} width={20} />
                  <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_500}>
                    {getString('ce.co.totalEmissions')}
                  </Text>
                </Layout.Horizontal>
                <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_500}>
                  <String
                    stringID="ce.common.emissionUnitHTML"
                    useRichText
                    vars={{ value: getEmissionsValue(_defaultTo(data?.total_cost, 0)) }}
                  />
                </Text>
              </Layout.Vertical>
            </Layout.Vertical>
          )}
        </Layout.Horizontal>
      </Layout.Vertical>
    </Container>
  )
}

export default COGatewayCumulativeAnalytics
