/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { TimePicker } from '@blueprintjs/datetime'
import { Radio } from '@blueprintjs/core'
import { defaultTo as _defaultTo, isEmpty as _isEmpty, capitalize as _capitalize } from 'lodash-es'
import * as Yup from 'yup'
import {
  Button,
  Container,
  DateInput,
  Formik,
  FormikForm,
  FormInput,
  Heading,
  Label,
  Layout,
  Text,
  PillToggle,
  Checkbox
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { FormikProps } from 'formik'
import { useParams } from 'react-router-dom'
import DaysOfWeekSelector from '@ce/common/DaysOfWeekSelector/DaysOfWeekSelector'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import {
  getMinDate,
  getStaticSchedulePeriodString,
  getStaticSchedulePeriodTime,
  getUserTimeZone
} from '@ce/utils/momentUtils'
import type { FixedScheduleClient, ScheduleTime } from '@ce/components/COCreateGateway/models'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useValidateStaticScheduleList } from 'services/lw'
import { DaysOfWeek } from '@ce/constants'
import { Utils } from '../Utils'
import { ScheduleDescription } from '../FixedSchedulesList/FixedSchedulesList'
import TimezoneSelector from '../TimeZoneSelector/TimeZoneSelector'
import css from './FixedScheduleForm.module.scss'

interface FixedScheduleFormProps {
  schedule?: FixedScheduleClient
  scheduleIndex?: number
  closeDialog: () => void
  isEdit?: boolean
  addSchedule: (schedule: FixedScheduleClient) => void
  allSchedules: FixedScheduleClient[]
}

interface DaysAndTimeSelectorProps {
  formikProps: FormikProps<FixedScheduleClient>
}

interface PeriodSelectionProps {
  formikProps: FormikProps<FixedScheduleClient>
}

const getTime = (timeVal: ScheduleTime | null) => {
  const date = new Date()
  date.setHours(_defaultTo(timeVal?.hour, 0))
  date.setMinutes(_defaultTo(timeVal?.min, 0))
  return date
}

const FixedScheduleForm: React.FC<FixedScheduleFormProps> = props => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const { currentUserInfo } = useAppStore()

  const [errorString, setErrorString] = useState<string>('')

  const { mutate: validateSchedules } = useValidateStaticScheduleList({ account_id: accountId })

  const getInitialValues = () => {
    return (
      props.schedule ||
      ({
        name: '',
        type: 'uptime',
        beginsOn: null,
        endsOn: null,
        startTime: null,
        endTime: null,
        allDay: true,
        repeats: [],
        everyday: true,
        timezone: getUserTimeZone(),
        isDeleted: false
      } as FixedScheduleClient)
    )
  }

  const getUpdatedScheduleData = (data: FixedScheduleClient) => {
    const updatedData = { ...data }
    if (data.everyday && _isEmpty(data.repeats)) {
      updatedData.repeats = Object.keys(DaysOfWeek)
        .filter(val => isNaN(Number(val)))
        .map((_k, i) => i)
    }
    return updatedData
  }

  const handleSubmit = async (data: FixedScheduleClient): Promise<FixedScheduleClient> => {
    const updatedData = getUpdatedScheduleData(data)
    try {
      const idParams = {
        accountId,
        userId: _defaultTo(currentUserInfo.uuid, ''),
        ruleId: 0
      }
      await validateSchedules(
        {
          schedules: [
            ...props.allSchedules
              .filter((s, i) => !s.isDeleted && i !== props.scheduleIndex)
              .map(s => Utils.convertScheduleClientToSchedule(s, idParams)),
            Utils.convertScheduleClientToSchedule(updatedData, idParams)
          ]
        },
        {
          queryParams: { accountIdentifier: accountId }
        }
      )
      props.addSchedule(updatedData)
    } catch (e) {
      setErrorString(e?.data?.errors?.join('\n'))
    }
    return updatedData
  }

  return (
    <Layout.Vertical spacing="xlarge" className={css.fixedScheduleFormContainer}>
      <Heading color={Color.GREY_800} level={2}>
        {props.isEdit
          ? getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.fixedSchedule')
          : getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.newScheduleTitle')}
      </Heading>
      {!_isEmpty(errorString) && <Text className={css.errorDisplayContainer}>{errorString}</Text>}
      <Formik
        initialValues={getInitialValues()}
        enableReinitialize
        onSubmit={handleSubmit}
        formName={'newScheduleForm'}
        validateOnMount={true}
        validationSchema={Yup.object().shape({
          name: Yup.string().min(1).max(25).required(),
          type: Yup.string().required(),
          repeats: Yup.array().when('beginsOn', {
            is: val => !val,
            then: Yup.array().when('everyday', {
              is: false,
              then: Yup.array().min(1).required(),
              otherwise: Yup.array().notRequired()
            })
          })
        })}
      >
        {_formikProps => (
          <FormikForm>
            <Layout.Vertical spacing={'large'}>
              <FormInput.Text name="name" label={getString('name') + '*'} />
              <Container className={css.inputRow}>
                <Layout.Horizontal spacing={'large'}>
                  <Container style={{ flex: 1 }}>
                    <Label>{_capitalize(getString('ce.co.gatewayReview.type')) + '*'}</Label>
                    <PillToggle
                      selectedView={_formikProps.values.type}
                      options={[
                        {
                          label: getString(
                            'ce.co.autoStoppingRule.configuration.step4.tabs.schedules.uptime'
                          ).toUpperCase(),
                          value: getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.uptime')
                        },
                        {
                          label: getString(
                            'ce.co.autoStoppingRule.configuration.step4.tabs.schedules.downtime'
                          ).toUpperCase(),
                          value: getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.downtime')
                        }
                      ]}
                      onChange={val => {
                        _formikProps.setFieldValue('type', val)
                      }}
                      className={css.typeToggle}
                    />
                  </Container>
                  <Container style={{ flex: 1 }}>
                    <Label>{getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.timezone')}</Label>
                    <TimezoneSelector
                      onTimezoneSelect={val => {
                        _formikProps.setFieldValue('timezone', val)
                      }}
                      timezone={_formikProps.values.timezone}
                    />
                  </Container>
                </Layout.Horizontal>
              </Container>
              <PeriodSelection formikProps={_formikProps} />
              <DaysAndTimeSelector formikProps={_formikProps} />
            </Layout.Vertical>
            {_formikProps.isValid && <ScheduleDescription schedule={getUpdatedScheduleData(_formikProps.values)} />}
            <Layout.Horizontal className={css.ctaContainer} spacing="medium">
              <Button
                text={getString('common.apply')}
                intent="primary"
                disabled={!_formikProps.isValid || !_formikProps.dirty}
                type="submit"
              />
              <Button text={getString('cancel')} onClick={props.closeDialog} />
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </Layout.Vertical>
  )
}

const PeriodSelection = ({ formikProps }: PeriodSelectionProps) => {
  const { getString } = useStrings()
  const [neverEnds, setNeverEnds] = useState(
    !_isEmpty(formikProps.values.beginsOn) ? _isEmpty(formikProps.values.endsOn) : true
  )

  const handleStartDateChange = (value: string | undefined, _err?: string) => {
    formikProps.setFieldValue('beginsOn', !_isEmpty(value) ? getStaticSchedulePeriodString(Number(value)) : null)
  }

  const handleEndDateChange = (value: string | undefined, _err?: string) => {
    formikProps.setFieldValue('endsOn', getStaticSchedulePeriodString(Number(value)))
  }

  const handleNeverEndsChange = (e: React.FormEvent<HTMLInputElement>) => {
    const checked = e.currentTarget.checked
    if (checked) {
      formikProps.setFieldValue('endsOn', null)
    }
    setNeverEnds(checked)
  }

  const hasBeginningDate = !_isEmpty(formikProps.values.beginsOn)

  return (
    <Container className={css.inputRow}>
      <Heading level={3} className={css.heading}>
        {getString('ce.co.gatewayConfig.setSchedulePeriodHeader')}
      </Heading>
      <Layout.Horizontal spacing={'large'}>
        <div style={{ flex: 1 }}>
          <Label>{getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.beginsOn')}</Label>
          <DateInput
            timePrecision="minute"
            disabled={true}
            dateProps={{
              timePickerProps: { useAmPm: true },
              highlightCurrentDay: true,
              minDate: hasBeginningDate
                ? new Date(getMinDate([new Date(formikProps.values.beginsOn as string), new Date()]))
                : new Date(),
              defaultValue: undefined
            }}
            value={formikProps.values.beginsOn ? `${getStaticSchedulePeriodTime(formikProps.values.beginsOn)}` : ''}
            onChange={handleStartDateChange}
            data-testid="beginsOn"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Label>{getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.endsOn')}</Label>
          {neverEnds && (
            <div className={css.disabledDateInput}>
              <DateInput disabled timePrecision="minute" dateProps={{ timePickerProps: { useAmPm: true } }} />
            </div>
          )}
          {!neverEnds && (
            <DateInput
              timePrecision="minute"
              disabled={true}
              dateProps={{
                timePickerProps: { useAmPm: true },
                defaultValue: undefined,
                minDate: hasBeginningDate ? new Date(formikProps.values.beginsOn as string) : new Date()
              }}
              value={
                !_isEmpty(formikProps.values.endsOn)
                  ? `${getStaticSchedulePeriodTime(formikProps.values.endsOn as string)}`
                  : ''
              }
              onChange={handleEndDateChange}
              data-testid="endsOn"
            />
          )}
        </div>
      </Layout.Horizontal>
      <Checkbox
        name={'neverEnds'}
        label={getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.neverEnds')}
        checked={neverEnds}
        onChange={handleNeverEndsChange}
        style={{ width: '20%' }}
      />
    </Container>
  )
}

const DaysAndTimeSelector = ({ formikProps }: DaysAndTimeSelectorProps) => {
  const { getString } = useStrings()

  const handleTimeRangeRadioSelection = () => {
    formikProps.setValues({
      ...formikProps.values,
      allDay: false,
      endTime: { hour: 0, min: 0 },
      startTime: { hour: 0, min: 0 }
    })
  }

  return (
    <Container>
      <Heading level={3} className={css.heading}>
        {getString('ce.co.gatewayConfig.setScheduleTimeHeader')}
      </Heading>
      <Layout.Horizontal spacing="large">
        <Container style={{ flex: 1 }}>
          <Label>{getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.repeats')}</Label>
          <Radio
            label={getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.everyday')}
            value="everyday"
            checked={formikProps.values.everyday}
            onChange={_ => {
              formikProps.setFieldValue('everyday', true)
              formikProps.setFieldValue('repeats', [])
              formikProps.validateForm()
            }}
          />
          <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'start' }}>
            <Radio
              label=""
              value="somedays"
              checked={!formikProps.values.everyday}
              onChange={_ => {
                formikProps.setFieldValue('everyday', false)
                formikProps.setFieldValue('repeats', [])
              }}
            />
            <DaysOfWeekSelector
              disable={formikProps.values.everyday}
              selection={formikProps.values.repeats}
              onChange={days => {
                const allDaysSelected = days.length === 7
                if (allDaysSelected) {
                  formikProps.setFieldValue('everyday', true)
                }
                formikProps.setFieldValue('repeats', allDaysSelected ? [] : days.map(d => d.id))
                if (days.length === 0) {
                  formikProps.setFieldValue('startTime', null)
                  formikProps.setFieldValue('endTime', null)
                  // formikProps.setFieldValue('allDay', false)
                }
              }}
            />
          </Layout.Horizontal>
        </Container>
        <Container style={{ flex: 1 }}>
          <Label>{getString('timeLabel')}</Label>
          <Radio
            label={getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.allDay')}
            value={'allDay'}
            checked={formikProps.values.allDay}
            onChange={_ => {
              formikProps.setFieldValue('allDay', true)
              formikProps.setFieldValue('startTime', null)
              formikProps.setFieldValue('endTime', null)
            }}
          />
          <Layout.Horizontal flex={{ alignItems: 'baseline', justifyContent: 'start' }}>
            <Radio
              label=""
              value={'sometime'}
              checked={!formikProps.values.allDay}
              onChange={handleTimeRangeRadioSelection}
            />
            <Container>
              <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'start' }} className={css.fromTime}>
                <Text>{getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.fromText')}</Text>
                <TimePicker
                  useAmPm
                  value={getTime(formikProps.values.startTime)}
                  disabled={formikProps.values.allDay}
                  onChange={d => {
                    formikProps.setFieldValue('startTime', { hour: d.getHours(), min: d.getMinutes() })
                  }}
                />
              </Layout.Horizontal>
              <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'start' }} className={css.toTime}>
                <Text>{getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.toText')}</Text>
                <TimePicker
                  useAmPm
                  value={getTime(formikProps.values.endTime)}
                  disabled={formikProps.values.allDay}
                  onChange={d => {
                    formikProps.setFieldValue('endTime', { hour: d.getHours(), min: d.getMinutes() })
                    if (_isEmpty(formikProps.values.startTime)) {
                      formikProps.setFieldValue('startTime', { hour: 0, min: 0 })
                    }
                  }}
                />
              </Layout.Horizontal>
            </Container>
          </Layout.Horizontal>
        </Container>
      </Layout.Horizontal>
    </Container>
  )
}

export default FixedScheduleForm
