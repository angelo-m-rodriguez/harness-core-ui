/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as Yup from 'yup'
import { pick, omit as _omit, defaultTo as _defaultTo } from 'lodash-es'
import cx from 'classnames'
import {
  Button,
  ButtonVariation,
  Container,
  Formik,
  FormikForm,
  FormInput,
  Layout,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  SelectOption,
  StepProps
} from '@wings-software/uicore'
import { NameIdDescriptionTags } from '@common/components'
import { StringUtils, useToaster } from '@common/exports'
import { getHeadingIdByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import routes from '@common/RouteDefinitions'
import { String, useStrings } from 'framework/strings'
import {
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  Failure,
  ResponseBoolean,
  useGetConnectorListV2,
  validateTheIdentifierIsUniquePromise
} from 'services/cd-ng'
import { CE_K8S_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import type { DetailsForm } from '../commonSteps/ConnectorDetailsStep'
import css from '../commonSteps/ConnectorDetailsStep.module.scss'
import overviewCss from './CEK8sConnector.module.scss'

interface OverviewStepProps {
  type: ConnectorInfoDTO['type']
  name: string
  setFormData?: (formData: ConnectorConfigDTO) => void
  formData?: ConnectorConfigDTO
  isEditMode?: boolean
  connectorInfo?: ConnectorInfoDTO | void
  mock?: ResponseBoolean
}

type Params = {
  accountId: string
  projectIdentifier: string
  orgIdentifier: string
}

type OverviewDetailsForm = DetailsForm & { referenceConnector: string }

const OverviewStep: React.FC<StepProps<ConnectorConfigDTO> & OverviewStepProps> = props => {
  const { prevStepData, nextStep } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<Params>()
  const mounted = useRef(false)
  const { showError } = useToaster()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const [loading, setLoading] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<SelectOption>()
  const [connectorOptions, setConnectorOptions] = useState<SelectOption[]>([])
  const isEdit = props.isEditMode || prevStepData?.isEdit
  const { getString } = useStrings()

  useStepLoadTelemetry(CE_K8S_CONNECTOR_CREATION_EVENTS.LOAD_OVERVIEW_STEP)

  const defaultQueryParams = useMemo(
    () => ({
      accountIdentifier: accountId,
      searchTerm: '',
      pageIndex: 0,
      pageSize: 100
    }),
    [accountId]
  )

  const { mutate: fetchConnectors, loading: connectorsLoading } = useGetConnectorListV2({
    queryParams: defaultQueryParams
  })

  const fetchAndSetConnectors = async () => {
    if (document.visibilityState === 'visible') {
      try {
        const connectorData = await fetchConnectors({ filterType: 'Connector', types: ['K8sCluster'] })
        const options: SelectOption[] =
          connectorData?.data?.content?.map(dataContent => ({
            value: _defaultTo(dataContent.connector?.identifier, ''),
            label: _defaultTo(dataContent.connector?.name, '')
          })) || []
        setConnectorOptions(options)
      } catch (e) {
        showError(e.message)
      }
    }
  }

  useEffect(() => {
    fetchAndSetConnectors()
    window.addEventListener('visibilitychange', fetchAndSetConnectors)
    return () => window.removeEventListener('visibilitychange', fetchAndSetConnectors)
  }, [])

  const handleSubmit = async (formData: ConnectorConfigDTO): Promise<void> => {
    mounted.current = true
    const configInfo = { ...props.connectorInfo } as ConnectorConfigDTO
    const spec = {
      featuresEnabled: configInfo?.spec?.featuresEnabled || ['VISIBILITY'],
      connectorRef: selectedConnector?.value || formData.referenceConnector,
      fixFeatureSelection: configInfo?.spec?.featuresEnabled?.includes('OPTIMIZATION') // TEMPORARY FLAG TO FIX FEATURE SELECTION IN CASE OF K8s RULE CREATION FLOW
    }
    if (isEdit) {
      //In edit mode validateTheIdentifierIsUnique API not required
      props.setFormData?.(formData)
      nextStep?.(_omit({ ...props.connectorInfo, ...prevStepData, ...formData }, 'referenceConnector'))
    } else {
      setLoading(true)
      try {
        const response = await validateTheIdentifierIsUniquePromise({
          queryParams: {
            identifier: formData.identifier,
            accountIdentifier: accountId,
            orgIdentifier: orgIdentifier,
            projectIdentifier: projectIdentifier
          },
          mock: props.mock
        })
        setLoading(false)

        if ('SUCCESS' === response.status) {
          if (response.data) {
            props.setFormData?.(formData)
            nextStep?.(_omit({ ...props.connectorInfo, ...prevStepData, ...formData, spec }, 'referenceConnector'))
          } else {
            modalErrorHandler?.showDanger(
              getString('validation.duplicateIdError', {
                connectorName: formData.name,
                connectorIdentifier: formData.identifier
              })
            )
          }
        } else {
          throw response as Failure
        }
      } catch (error) {
        setLoading(false)
        modalErrorHandler?.showDanger(error.message)
      }
    }
  }

  const getInitialValues = () => {
    if (isEdit) {
      return {
        ...pick(props.connectorInfo, ['name', 'identifier', 'description', 'tags']),
        referenceConnector: (props.connectorInfo as ConnectorInfoDTO)?.spec?.connectorRef
      }
    } else {
      return {
        name: '',
        description: '',
        identifier: '',
        tags: {},
        referenceConnector: props.prevStepData?.spec?.connectorRef
      }
    }
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.OverviewLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.CEK8
  })

  return (
    <Layout.Vertical spacing="xxlarge" className={cx(css.firstep, overviewCss.overviewStep)}>
      <div className={css.heading}>{getString(getHeadingIdByType(props.type))}</div>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <div className={overviewCss.infoSection}>{getString('connectors.ceK8.infoText')}</div>
      <Container padding="small" className={cx(css.connectorForm, overviewCss.formCont)}>
        <Formik<OverviewDetailsForm>
          formName="overViewStepForm"
          onSubmit={formData => {
            trackEvent(ConnectorActions.OverviewSubmit, {
              category: Category.CONNECTOR,
              connector_type: Connectors.CEK8
            })
            handleSubmit(formData)
          }}
          validationSchema={Yup.object().shape({
            name: Yup.string().trim().required(getString('validation.connectorName')),
            identifier: Yup.string().when('name', {
              is: val => val?.length,
              then: Yup.string()
                .trim()
                .required(getString('validation.identifierRequired'))
                .matches(/^(?![0-9])[0-9a-zA-Z_$]*$/, getString('validation.validIdRegex'))
                .notOneOf(StringUtils.illegalIdentifiers)
            }),
            referenceConnector: Yup.string().required('Select a connector')
          })}
          initialValues={{
            ...(getInitialValues() as OverviewDetailsForm),
            ...prevStepData,
            ...props.formData
          }}
        >
          {formikProps => {
            return (
              <FormikForm>
                <Container style={{ minHeight: 300 }}>
                  <Layout.Horizontal flex={{ justifyContent: 'start' }}>
                    <FormInput.Select
                      name="referenceConnector"
                      label={getString('connectors.ceK8.selectConnectorLabel')}
                      items={connectorOptions}
                      disabled={connectorsLoading}
                      onChange={_item => {
                        const val = `${_item.label}-Cost-access`
                        setSelectedConnector(_item)
                        formikProps.setFieldValue('name', val)
                        formikProps.setFieldValue(
                          'identifier',
                          val
                            .trim()
                            .replace(/[^0-9a-zA-Z_$ ]/g, '')
                            .replace(/ +/g, '_')
                        )
                      }}
                      className={overviewCss.selectConnector}
                    />
                    <Link
                      to={routes.toConnectors({ accountId })}
                      target="_blank"
                      className={overviewCss.createNewConnCta}
                    >
                      <Button
                        variation={ButtonVariation.SECONDARY}
                        text={getString('connectors.ceK8.overview.createNewConnectorCta')}
                        icon={'plus'}
                      />
                    </Link>
                  </Layout.Horizontal>
                  <NameIdDescriptionTags
                    className={cx(css.formElm, overviewCss.nameField)}
                    formikProps={formikProps}
                    identifierProps={{ inputName: 'name', isIdentifierEditable: !isEdit }}
                  />
                </Container>
                <Layout.Horizontal>
                  <Button type="submit" intent="primary" rightIcon="chevron-right" disabled={loading}>
                    <String stringID="saveAndContinue" />
                  </Button>
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Container>
    </Layout.Vertical>
  )
}

export default OverviewStep
