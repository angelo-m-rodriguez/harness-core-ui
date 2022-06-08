/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { Layout, FormInput, Utils, useConfirmationDialog } from '@wings-software/uicore'
import { Intent } from '@harness/design-system'
import { NameIdDescriptionTags } from '@common/components'
import { useStrings } from 'framework/strings'
import type { MonitoredServiceDTO } from 'services/cv'
import CardWithOuterTitle from '@cv/pages/health-source/common/CardWithOuterTitle/CardWithOuterTitle'
import {
  useGetHarnessServices,
  useGetHarnessEnvironments,
  HarnessServiceAsFormField,
  HarnessEnvironmentAsFormField
} from '@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment'
import { ChangeSourceCategoryName } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import type { EnvironmentSelectOrCreateProps } from '@cv/components/HarnessServiceAndEnvironment/components/EnvironmentSelectOrCreate/EnvironmentSelectOrCreate'
import type { EnvironmentMultiSelectOrCreateProps } from '@cv/components/HarnessServiceAndEnvironment/components/EnvironmentMultiSelectAndEnv/EnvironmentMultiSelectAndEnv'
import { useMonitoredServiceContext } from '@cv/pages/monitored-service/MonitoredServiceContext'
import { MonitoredServiceTypeOptions } from './MonitoredServiceOverview.constants'
import {
  updateMonitoredServiceNameForService,
  updatedMonitoredServiceNameForEnv,
  serviceOnSelect
} from './MonitoredServiceOverview.utils'
import type { MonitoredServiceOverviewProps } from './MonitoredSourceOverview.types'
import css from './MonitoredServiceOverview.module.scss'

export default function MonitoredServiceOverview(props: MonitoredServiceOverviewProps): JSX.Element {
  const { formikProps, isEdit, onChangeMonitoredServiceType } = props
  const { isTemplate } = useMonitoredServiceContext()
  const { getString } = useStrings()
  const [tempServiceType, setTempServiceType] = useState<MonitoredServiceDTO['type']>()
  const { serviceOptions, setServiceOptions } = useGetHarnessServices()
  const { environmentOptions, setEnvironmentOptions } = useGetHarnessEnvironments()
  const values = formikProps.values || {}
  const keys = useMemo(() => [Utils.randomId(), Utils.randomId()], [values.serviceRef, values.environmentRef])

  const { openDialog } = useConfirmationDialog({
    contentText: getString('cv.monitoredServices.changeMonitoredServiceTypeMessage'),
    titleText: getString('cv.monitoredServices.changeMonitoredServiceType'),
    cancelButtonText: getString('cancel'),
    confirmButtonText: getString('confirm'),
    intent: Intent.WARNING,
    onCloseDialog: (isConfirmed: boolean) => {
      if (isConfirmed) {
        onChangeMonitoredServiceType?.(tempServiceType as MonitoredServiceDTO['type'])
      }
    }
  })
  const onSelect = useCallback(
    environment => updatedMonitoredServiceNameForEnv(formikProps, environment, formikProps.values?.type),
    [formikProps.values]
  )
  return (
    <CardWithOuterTitle title={getString('overview')} className={css.monitoredService}>
      {!isEdit ? (
        <>
          <Layout.Horizontal spacing="large">
            <FormInput.Select
              name="type"
              tooltipProps={{ dataTooltipId: 'monitoredServiceType' }}
              items={MonitoredServiceTypeOptions}
              label={getString('typeLabel')}
              value={
                formikProps.values?.type === 'Infrastructure'
                  ? MonitoredServiceTypeOptions[1]
                  : MonitoredServiceTypeOptions[0]
              }
              onChange={item => {
                if (formikProps.values.type !== item.value) {
                  openDialog()
                  formikProps.setFieldValue('type', formikProps.values.type)
                  setTempServiceType(item.value as MonitoredServiceDTO['type'])
                }
              }}
            />
            <HarnessServiceAsFormField
              key={keys[0]}
              customRenderProps={{
                name: 'serviceRef',
                label: getString('cv.healthSource.serviceLabel')
              }}
              serviceProps={{
                className: css.dropdown,
                disabled: isEdit,
                isMultiType: isTemplate,
                item: serviceOptions.find(item => item?.value === values.serviceRef) || values.serviceRef,
                options: serviceOptions,
                onSelect: selectedService => serviceOnSelect(isTemplate, selectedService, formikProps),
                onNewCreated: newOption => {
                  if (newOption?.identifier && newOption.name) {
                    const newServiceOption = { label: newOption.name, value: newOption.identifier }
                    setServiceOptions([newServiceOption, ...serviceOptions])
                    updateMonitoredServiceNameForService(formikProps, newServiceOption)
                  }
                }
              }}
            />
            <HarnessEnvironmentAsFormField
              key={keys[1]}
              customRenderProps={{
                name: 'environmentRef',
                label: getString('cv.healthSource.environmentLabel')
              }}
              isMultiSelectField={formikProps.values?.type === ChangeSourceCategoryName.INFRASTRUCTURE}
              environmentProps={
                {
                  className: css.dropdown,
                  disabled: isEdit,
                  isMultiType: isTemplate,
                  popOverClassName: css.popOverClassName,
                  item:
                    formikProps.values?.type === ChangeSourceCategoryName.INFRASTRUCTURE
                      ? environmentOptions.filter(it => values.environmentRef?.includes(it.value as string))
                      : environmentOptions.find(item => item?.value === values.environmentRef) || values.environmentRef,
                  onSelect,
                  options: environmentOptions,
                  onNewCreated: newOption => {
                    if (newOption?.identifier && newOption.name) {
                      const newEnvOption = { label: newOption.name, value: newOption.identifier }
                      setEnvironmentOptions([newEnvOption, ...environmentOptions])
                      updatedMonitoredServiceNameForEnv(formikProps, newEnvOption, formikProps.values?.type)
                    }
                  }
                } as EnvironmentMultiSelectOrCreateProps | EnvironmentSelectOrCreateProps
              }
            />
          </Layout.Horizontal>
          <hr className={css.divider} />
        </>
      ) : null}
      {!isTemplate && (
        <NameIdDescriptionTags
          formikProps={formikProps}
          inputGroupProps={{
            disabled: formikProps.values?.type === ChangeSourceCategoryName.INFRASTRUCTURE ? false : true
          }}
          className={css.nameTagsDescription}
          identifierProps={{
            isIdentifierEditable: formikProps.values?.type === ChangeSourceCategoryName.INFRASTRUCTURE ? true : false,
            inputLabel: getString('cv.monitoredServices.monitoredServiceName')
          }}
          tooltipProps={{ dataTooltipId: 'NameIdDescriptionTagsHealthSource' }}
        />
      )}
    </CardWithOuterTitle>
  )
}
