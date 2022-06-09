/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Slider } from '@blueprintjs/core'
import { DropDown, Layout, Text, TextInput, SelectOption, PageError, Container } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { UsageAndLimitReturn } from '@common/hooks/useGetUsageAndLimit'
import { Editions, SubscriptionProps } from '@common/constants/SubscriptionTypes'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import css from './CostCalculator.module.scss'

const SliderWrapper = ({
  min,
  max,
  stepSize,
  labelStepSize,
  value,
  onChange
}: {
  min: number
  max: number
  stepSize: number
  labelStepSize: number
  value: number
  onChange: (value: number) => void
}): React.ReactElement => {
  return (
    <Slider
      className={css.slider}
      min={min}
      max={max}
      stepSize={stepSize}
      value={value}
      onChange={onChange}
      labelStepSize={labelStepSize}
    />
  )
}

const SliderBar = ({
  title,
  min,
  max,
  stepSize,
  labelStepSize,
  list,
  value,
  setValue,
  unit
}: {
  title: React.ReactElement
  min: number
  max: number
  stepSize: number
  labelStepSize: number
  list?: number[]
  value: number
  setValue: (value: number) => void
  unit?: string
}): React.ReactElement => {
  const dropdownList = React.useMemo(() => {
    return (
      list?.reduce((accumulator: SelectOption[], current) => {
        accumulator.push({
          label: `${current.toString()}${unit}`,
          value: current + ''
        } as SelectOption)
        return accumulator
      }, []) || []
    )
  }, [list, unit])

  return (
    <Layout.Vertical width={'50%'} padding={{ right: 'xlarge' }}>
      {title}
      <Layout.Horizontal spacing={'large'}>
        <SliderWrapper
          min={min}
          max={max}
          stepSize={stepSize}
          value={value}
          onChange={newValue => {
            setValue(newValue)
          }}
          labelStepSize={labelStepSize}
        />
        {list ? (
          <DropDown
            buttonTestId="slider-dropdown"
            filterable={false}
            width={70}
            items={dropdownList}
            value={value.toString()}
            onChange={selected => setValue(Number(selected.value))}
            placeholder={`  ${unit}`}
            className={css.dropdown}
          />
        ) : (
          <TextInput
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(Number(e.target.value))}
            value={value.toString()}
            className={css.textInput}
          />
        )}
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export const FFNewSubscription = ({
  usageAndLimitInfo,
  setQuantities,
  subscriptionProps
}: {
  usageAndLimitInfo: UsageAndLimitReturn
  setQuantities: (quantities: Record<string, number>) => void
  subscriptionProps: SubscriptionProps
}): React.ReactElement => {
  const { getString } = useStrings()

  const { usageData } = usageAndLimitInfo
  const { usage } = usageData
  const activeLicenses = usage?.ff?.activeFeatureFlagUsers?.count || 0
  const activeMAUs = usage?.ff?.activeClientMAUs?.count || 0
  const numberOfMau = subscriptionProps.quantities?.cf?.numberOfMau || activeMAUs
  const numberOfDevelopers = subscriptionProps.quantities?.cf?.numberOfDevelopers || activeLicenses

  const [licenseRange, setLicensesRange] = useState<{
    min: number
    max: number
    stepSize: number
    labelStepSize: number
  }>({ min: 0, max: 0, stepSize: 1, labelStepSize: 1 })
  const [mausRange, setMausRange] = useState<{
    min: number
    max: number
    stepSize: number
    labelStepSize: number
    list: number[]
    unit: string
  }>({
    min: 0,
    max: 0,
    stepSize: 1,
    labelStepSize: 1,
    list: [],
    unit: ''
  })

  const { loadingUsage, usageErrorMsg, refetchUsage } = usageData

  useEffect(() => {
    // TODO: get tier from prices api call
    if (subscriptionProps.edition === Editions.TEAM) {
      setLicensesRange({
        min: 0,
        max: 50,
        stepSize: 1,
        labelStepSize: 10
      })
      setMausRange({
        min: 0,
        max: 500,
        stepSize: 100,
        labelStepSize: 100,
        list: [100, 200, 300, 400, 500],
        unit: 'K'
      })
    } else {
      setLicensesRange({
        min: 25,
        max: 100,
        stepSize: 1,
        labelStepSize: 25
      })
      setMausRange({
        min: 0,
        max: 25,
        stepSize: 5,
        labelStepSize: 5,
        list: [0, 5, 10, 15, 20, 25],
        unit: 'M'
      })
    }
  }, [subscriptionProps.edition, activeLicenses, activeMAUs])

  if (loadingUsage) {
    return <ContainerSpinner />
  }

  if (usageErrorMsg) {
    return (
      <Container width={300}>
        <PageError message={usageErrorMsg} onClick={refetchUsage} />
      </Container>
    )
  }

  const mausTitle = (
    <Layout.Horizontal flex={{ alignItems: 'baseline', justifyContent: 'start' }}>
      <Text font={{ weight: 'bold' }}>{getString('authSettings.costCalculator.maus')}</Text>
      <Text font={{ size: 'small' }}>
        , {mausRange.stepSize}
        {mausRange.unit} {getString('authSettings.costCalculator.increments')}
      </Text>
    </Layout.Horizontal>
  )

  return (
    <Layout.Horizontal>
      <SliderBar
        title={<Text font={{ weight: 'bold' }}>{getString('authSettings.costCalculator.developerLicenses')}</Text>}
        min={licenseRange.min}
        max={licenseRange.max}
        stepSize={licenseRange.stepSize}
        labelStepSize={licenseRange.labelStepSize}
        value={numberOfDevelopers}
        setValue={(value: number) => {
          setQuantities({
            numberOfDevelopers: value,
            numberOfMau
          })
        }}
      />
      <SliderBar
        title={mausTitle}
        min={mausRange.min}
        max={mausRange.max}
        stepSize={mausRange.stepSize}
        labelStepSize={mausRange.labelStepSize}
        list={mausRange.list}
        value={numberOfMau}
        setValue={(value: number) => {
          setQuantities({
            numberOfDevelopers,
            numberOfMau: value
          })
        }}
        unit={mausRange.unit}
      />
    </Layout.Horizontal>
  )
}
