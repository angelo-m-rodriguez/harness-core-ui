/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Container, FormInput, MultiTypeInputType, useToaster } from '@harness/uicore'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import Card from '@cv/components/Card/Card'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  ChangeSourceDTO,
  MonitoredServiceDTO,
  MonitoredServiceResponse,
  useGetAllMonitoredServicesWithTimeSeriesHealthSources,
  useGetMonitoredService
} from 'services/cv'
import { getMonitoredServiceOptions } from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.utils'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { useStrings } from 'framework/strings'
import type { ContinousVerificationData } from '@cv/components/PipelineSteps/ContinousVerification/types'
import VerifyStepHealthSourceTable from '@cv/pages/health-source/HealthSourceTable/VerifyStepHealthSourceTable'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { RowData } from '@cv/pages/health-source/HealthSourceDrawer/HealthSourceDrawerContent.types'
import { getMonitoredServiceRef } from '@cv/components/PipelineSteps/ContinousVerification/utils'
import { getMultiTypeInputProps } from '../VerificationJobFields/VerificationJobFields.utils'
import {
  getEnvironmentIdentifierFromStage,
  getNewSpecs,
  getServiceIdentifierFromStage
} from '../MonitoredService/MonitoredService.utils'
import { isMonitoredServiceFixedInput } from './ConfiguredMonitoredService.utils'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface ConfiguredMonitoredServiceProps {
  allowableTypes: MultiTypeInputType[]
  formik: FormikProps<ContinousVerificationData>
}

export default function ConfiguredMonitoredService(props: ConfiguredMonitoredServiceProps): JSX.Element {
  const {
    allowableTypes,
    formik: { values: formValues, setFieldValue }
  } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { showError } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [healthSourcesList, setHealthSourcesList] = useState<RowData[]>([])
  const [monitoredServiceInfo, setMonitoredServiceInfo] = useState({
    identifier: '',
    name: ''
  })
  const monitoredServiceRef = getMonitoredServiceRef(formValues?.spec)

  const {
    state: {
      selectionState: { selectedStageId },
      pipeline
    },
    getStageFromPipeline
  } = usePipelineContext()
  const selectedStage = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId as string)?.stage

  const environmentIdentifier = useMemo(() => {
    return getEnvironmentIdentifierFromStage(selectedStage)
  }, [selectedStage])

  const serviceIdentifier = useMemo(() => {
    return getServiceIdentifierFromStage(selectedStage, pipeline)
  }, [pipeline, selectedStage])

  const queryParams = useMemo(() => {
    return {
      accountId,
      orgIdentifier,
      projectIdentifier
    }
  }, [accountId, orgIdentifier, projectIdentifier])

  const {
    data: monitoredServicesData,
    loading: monitoredServicesLoading,
    error: monitoredServicesDataError
  } = useGetAllMonitoredServicesWithTimeSeriesHealthSources({
    queryParams
  })

  const {
    data: monitoredServiceData,
    refetch: fetchMonitoredServiceData,
    loading: monitoredServiceLoading,
    error: monitoredServiceError
  } = useGetMonitoredService({
    identifier: monitoredServiceRef as string,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })

  const monitoredService = monitoredServiceData?.data?.monitoredService

  useEffect(() => {
    //when monitoredServiceData is selected from the dropdown
    if (isMonitoredServiceFixedInput(monitoredServiceRef)) {
      fetchMonitoredServiceData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoredServiceRef])

  useEffect(() => {
    if (monitoredService) {
      let newSpecs = { ...formValues.spec }
      newSpecs = getNewSpecs(monitoredService, formValues)
      setFieldValue('spec', newSpecs)
      setHealthSourcesList(monitoredService?.sources?.healthSources as RowData[])
      setMonitoredServiceInfo({
        identifier: monitoredService?.identifier as string,
        name: monitoredService?.name as string
      })
      // const formNewValues = { ...formValues, spec: newSpecs }
      // formik.resetForm({ values: formNewValues })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoredService])

  useEffect(() => {
    const error = monitoredServicesDataError || monitoredServiceError
    if (error) {
      showError(getErrorMessage(error))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoredServicesDataError, monitoredServiceError])

  const onSuccess = useCallback(
    (updatedMonitoredService: MonitoredServiceResponse) => {
      const { sources } = updatedMonitoredService?.monitoredService || { sources: { healthSources: [] } }
      const newSpecs = getNewSpecs(updatedMonitoredService?.monitoredService, formValues)
      setFieldValue('spec', newSpecs)
      setHealthSourcesList(sources?.healthSources as RowData[])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formValues?.spec, monitoredService?.identifier]
  )

  const monitoredServicesOptions = useMemo(
    () => getMonitoredServiceOptions(monitoredServicesData?.data),
    [monitoredServicesData]
  )

  const renderConfiguredMonitoredService = (): JSX.Element => {
    if (monitoredServiceLoading) {
      return (
        <Container padding="medium">{getString('connectors.cdng.monitoredService.fetchingHealthSources')}</Container>
      )
    } else if (isMonitoredServiceFixedInput(monitoredServiceRef)) {
      return (
        <VerifyStepHealthSourceTable
          serviceIdentifier={serviceIdentifier}
          envIdentifier={environmentIdentifier}
          healthSourcesList={healthSourcesList}
          monitoredServiceData={monitoredServiceData as MonitoredServiceDTO}
          monitoredServiceRef={monitoredServiceInfo}
          onSuccess={onSuccess}
          isRunTimeInput={false}
          changeSourcesList={monitoredService?.sources?.changeSources as ChangeSourceDTO[]}
        />
      )
    } else {
      return <></>
    }
  }

  return (
    <Card>
      <>
        <div className={cx(stepCss.formGroup)}>
          <FormInput.MultiTypeInput
            name="spec.monitoredService.spec.monitoredServiceRef"
            label={'Monitored Service'}
            useValue
            placeholder={monitoredServicesLoading ? getString('loading') : 'Select Monitored Service'}
            selectItems={monitoredServicesOptions}
            multiTypeInputProps={getMultiTypeInputProps(expressions, allowableTypes)}
          />
        </div>
        {renderConfiguredMonitoredService()}
      </>
    </Card>
  )
}
