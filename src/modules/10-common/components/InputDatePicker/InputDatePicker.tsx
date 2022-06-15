/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useRef, useEffect } from 'react'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import { FormGroup, InputGroup } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import type { DynamicPopoverHandlerBinding } from '@common/exports'
import { DynamicPopover } from '..'
interface InputDatePickerProps {
  formikProps: any
}

export default function InputDatePicker(props: InputDatePickerProps) {
  const { getString } = useStrings()
  const ref = useRef(null)
  const { formikProps } = props
  const getText = () => {
    return formikProps?.values?.timeRange
      ? `${new Date(formikProps?.values?.timeRange?.startTime)?.toLocaleDateString() || ''} - ${
          new Date(formikProps?.values?.timeRange?.endTime)?.toLocaleDateString() || ''
        }`
      : null
  }
  const [dynamicPopoverHandler, setDynamicPopoverHandler] = React.useState<
    DynamicPopoverHandlerBinding<{ data: null }> | undefined
  >()
  const [chartTimeRange, setChartTimeRange] = useState<{ startTime: number; endTime: number }>()
  const getValue = (): DateRange | undefined => {
    return [new Date(chartTimeRange?.startTime || 0), new Date(chartTimeRange?.endTime || 0)]
  }

  const hideDynamicPopover = () => {
    dynamicPopoverHandler?.hide()
  }

  useEffect(() => {
    const filterForm = document.getElementsByClassName('FormikForm--main')[0]
    if (filterForm) {
      filterForm.addEventListener('click', hideDynamicPopover)
    }
    return () => {
      filterForm.removeEventListener('click', hideDynamicPopover)
    }
  }, [])

  const renderPopover = () => {
    return (
      <div onBlur={() => dynamicPopoverHandler?.hide()}>
        <DateRangePicker
          allowSingleDayRange={true}
          shortcuts={true}
          defaultValue={getValue()}
          minDate={new Date(0)}
          maxDate={new Date()}
          onChange={selectedDates => {
            formikProps?.setValues({
              ...formikProps.values,
              timeRange: {
                startTime: selectedDates[0]?.getTime(),
                endTime: selectedDates[1]?.getTime()
              }
            })
            setChartTimeRange?.({
              startTime: selectedDates[0]?.getTime() || 0,
              endTime: selectedDates[1]?.getTime() || 0
            })
          }}
        />
      </div>
    )
  }
  return (
    <>
      <div
        data-nodeid="inputDatePicker"
        data-testid="inputDatePicker"
        ref={ref}
        onClick={() => {
          dynamicPopoverHandler?.show(`[data-nodeid="inputDatePicker"]`, { data: null })
        }}
      >
        <FormGroup label={getString('common.timeframe')}>
          <InputGroup placeholder={getText() || getString('common.selectTimeFrame')} />
        </FormGroup>
      </div>
      <DynamicPopover render={renderPopover} bind={setDynamicPopoverHandler} />
    </>
  )
}
