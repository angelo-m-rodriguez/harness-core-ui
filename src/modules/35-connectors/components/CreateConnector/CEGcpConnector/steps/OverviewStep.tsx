/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  Container,
  Formik,
  FormikForm,
  FormInput,
  Heading,
  Layout,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  StepProps,
  Icon
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { pick, omit, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import {
  ConnectorInfoDTO,
  GcpCloudCostConnector,
  ConnectorFilterProperties,
  useGetConnectorListV2,
  GetConnectorListV2QueryParams,
  Failure,
  GcpBillingExportSpec
} from 'services/cd-ng'
import { Description, Tags } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { CE_GCP_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import css from '../CreateCeGcpConnector.module.scss'

interface OverviewDetails {
  name: string
  projectId: string
  identifier: string
  description: string
  tags: Record<string, any>
}

export interface ExistingCURDetails extends GcpBillingExportSpec {
  projectId: string
}

export interface CEGcpConnectorDTO extends ConnectorInfoDTO {
  spec: GcpCloudCostConnector
  includeBilling?: boolean
  isEditMode?: boolean
  serviceAccount?: string
  existingCurReports?: ExistingCURDetails[]
}

interface OverviewProps extends StepProps<CEGcpConnectorDTO> {
  isEditMode?: boolean
  connectorInfo?: CEGcpConnectorDTO
}

const OverviewStep: React.FC<OverviewProps> = props => {
  const { getString } = useStrings()
  const [isUniqueConnector, setIsUniqueConnector] = useState(true)
  const [featureText, setFeatureText] = useState<string>('')
  const [existingConnectorName, setExistingConnectorName] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()

  useStepLoadTelemetry(CE_GCP_CONNECTOR_CREATION_EVENTS.LOAD_OVERVIEW_STEP)

  const { prevStepData, nextStep, isEditMode, connectorInfo } = props
  const { accountId } = useParams<{
    accountId: string
  }>()

  const [isLoading, setIsLoading] = useState(false)

  const defaultQueryParams: GetConnectorListV2QueryParams = {
    pageIndex: 0,
    pageSize: 10,
    accountIdentifier: accountId,
    getDistinctFromBranches: false
  }

  const filterParams: ConnectorFilterProperties = {
    types: ['GcpCloudCost'],
    filterType: 'Connector'
  }

  const { mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: defaultQueryParams
  })

  const getFeatures = (featuresEnabled: string[]) => {
    let newFeatureText = featuresEnabled.join(' and ')
    if (featuresEnabled.length > 2) {
      featuresEnabled.push(`and ${featuresEnabled.pop()}`)
      newFeatureText = featuresEnabled.join(', ')
    }
    setFeatureText(newFeatureText)
  }

  const handleSubmit = async (formData: OverviewDetails) => {
    setIsLoading(true)
    filterParams.ccmConnectorFilter = {
      gcpProjectId: formData.projectId
    }
    const newSpec: GcpCloudCostConnector = {
      ...connectorInfo?.spec,
      ...prevStepData?.spec,
      ...pick(formData, ['projectId']),
      serviceAccountEmail: ''
    }
    const payload: CEGcpConnectorDTO = {
      ...omit(formData, ['projectId']),
      type: 'GcpCloudCost',
      spec: newSpec,
      isEditMode: isEditMode,
      existingCurReports: []
    }

    let includesBilling
    if (connectorInfo?.spec?.featuresEnabled) {
      includesBilling = connectorInfo?.spec?.featuresEnabled.includes('BILLING')
    }

    const curReportExistFilterParams: ConnectorFilterProperties = {
      ...filterParams,
      ccmConnectorFilter: {
        featuresEnabled: ['BILLING']
      }
    }

    try {
      const response = await fetchConnectors(filterParams)
      if (response.status == 'SUCCESS') {
        if (response?.data?.pageItemCount == 0 || isEditMode) {
          const curResponse = await fetchConnectors(curReportExistFilterParams)
          if (curResponse.status == 'SUCCESS') {
            if (curResponse?.data?.pageItemCount == 0 || includesBilling) {
              nextStep?.(payload)
            } else {
              const existingCurReports: ExistingCURDetails[] =
                curResponse.data?.content?.map(ele => ({
                  projectId: ele?.connector?.spec?.projectId,
                  datasetId: ele.connector?.spec?.billingExportSpec?.datasetId,
                  tableId: ele.connector?.spec?.billingExportSpec?.tableId
                })) || []
              payload.existingCurReports = existingCurReports
              nextStep?.(payload)
            }
          } else {
            throw response as Failure
          }
        } else {
          setIsLoading(false)
          setIsUniqueConnector(false)
          setExistingConnectorName(response?.data?.content?.[0]?.connector?.name || '')
          setProjectId(formData.projectId)
          const featuresEnabled = response?.data?.content?.[0]?.connector?.spec?.featuresEnabled || []
          getFeatures(featuresEnabled)
        }
      } else {
        setIsLoading(false)
        throw response as Failure
      }
    } catch (e) {
      setIsLoading(false)
      modalErrorHandler?.showDanger(e?.data?.message)
    }
  }

  const getInitialValues = () => {
    return {
      ...pick(connectorInfo, ['name', 'identifier', 'description', 'tags']),
      ...pick(prevStepData, ['name', 'identifier', 'description', 'tags']),
      projectId: prevStepData?.spec?.projectId || connectorInfo?.spec?.projectId || ''
    }
  }

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Heading level={2} className={css.header}>
        {getString('connectors.ceGcp.overview.heading')}
      </Heading>
      <div style={{ flex: 1 }}>
        <Formik<OverviewDetails>
          initialValues={getInitialValues() as OverviewDetails}
          onSubmit={formData => {
            handleSubmit(formData)
          }}
          formName="ceGcpOverview"
        >
          {formikProps => (
            <FormikForm>
              <ModalErrorHandler bind={() => setModalErrorHandler} />
              <Container style={{ minHeight: 550 }}>
                <Container className={css.main} style={{ width: '65%' }}>
                  <Layout.Vertical spacing="large">
                    <FormInput.InputWithIdentifier
                      inputLabel={getString('connectors.name')}
                      isIdentifierEditable={!isEditMode}
                    />
                    <FormInput.Text
                      tooltipProps={{
                        dataTooltipId: 'gcpConnectorProjectId'
                      }}
                      name={'projectId'}
                      label={getString('connectors.ceGcp.overview.projectIdLabel')}
                    />
                    <Layout.Vertical spacing="small">
                      <Description descriptionProps={{}} hasValue={!!formikProps?.values.description} />
                      <Tags tagsProps={{}} isOptional={true} hasValue={!isEmpty(formikProps?.values.tags)} />
                    </Layout.Vertical>
                  </Layout.Vertical>
                </Container>
                {!isUniqueConnector && (
                  <div className={css.connectorExistBox}>
                    <Layout.Vertical spacing="large">
                      <div style={{ color: 'red' }}>
                        <Icon name="circle-cross" color="red700" style={{ paddingRight: 5 }}></Icon>
                        <span style={{ fontSize: 'var(--font-size-normal)' }}>
                          {getString('connectors.ceGcp.overview.alreadyExist')}
                        </span>
                      </div>
                      <div>
                        <Icon name="info" style={{ paddingRight: 5 }}></Icon>
                        {getString('connectors.ceGcp.overview.alreadyExistInfo', {
                          projectId,
                          existingConnectorName,
                          featureText
                        })}
                      </div>
                      {/* <div>
                        <Icon name="lightbulb" style={{ paddingRight: 5 }}></Icon>
                        {getString('connectors.ceAws.overview.trySuggestion')}
                        <div>
                          {getString('connectors.ceAws.overview.editConnector')} <a>{existingConnectorName}</a>{' '}
                          {getString('connectors.ceAws.overview.ifReq')}
                        </div>
                      </div> */}
                    </Layout.Vertical>
                  </div>
                )}
              </Container>
              <Layout.Horizontal spacing="medium">
                <Button
                  type="submit"
                  intent="primary"
                  text={getString('continue')}
                  rightIcon="chevron-right"
                  disabled={isLoading}
                  loading={isLoading}
                />
                {isLoading && <Icon name="spinner" size={24} color="blue500" />}
              </Layout.Horizontal>
            </FormikForm>
          )}
        </Formik>
      </div>
    </Layout.Vertical>
  )
}

export default OverviewStep
