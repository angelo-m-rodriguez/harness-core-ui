/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import {
  Formik,
  Page,
  useToaster,
  Container,
  Layout,
  Button,
  Heading,
  Dialog,
  Text,
  HarnessDocTooltip
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import routes from '@common/RouteDefinitions'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { ServiceLevelObjectiveDTO, useGetServiceLevelObjective, useSaveSLOData, useUpdateSLOData } from 'services/cv'
import { useQueryParams } from '@common/hooks'
import { getCVMonitoringServicesSearchParam, getErrorMessage } from '@cv/utils/CommonUtils'
import sloReviewChange from '@cv/assets/sloReviewChange.svg'
import { MonitoredServiceEnum } from '@cv/pages/monitored-service/MonitoredServicePage.constants'
import CreateSLOForm from './components/CreateSLOForm/CreateSLOForm'
import { getSLOInitialFormData, createSLORequestPayload, getIsUserUpdatedSLOData } from './CVCreateSLO.utils'
import { getSLOFormValidationSchema } from './CVCreateSLO.constants'
import type { SLOForm } from './CVCreateSLO.types'

const CVCreateSLO: React.FC = () => {
  const history = useHistory()
  const { getString } = useStrings()

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.slos.title')])

  const { showSuccess, showError } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier, identifier } = useParams<
    ProjectPathProps & { identifier: string }
  >()
  const { monitoredServiceIdentifier } = useQueryParams<{ monitoredServiceIdentifier?: string }>()

  const projectIdentifierRef = useRef<string>()
  const sloPayloadRef = useRef<ServiceLevelObjectiveDTO | null>(null)

  useEffect(() => {
    if (projectIdentifierRef.current && projectIdentifierRef.current !== projectIdentifier) {
      history.push(routes.toCVSLOs({ accountId, orgIdentifier, projectIdentifier, module: 'cv' }))
      return
    }

    projectIdentifierRef.current = projectIdentifier
  }, [projectIdentifier, accountId, orgIdentifier, history])

  const { mutate: createSLO, loading: createSLOLoading } = useSaveSLOData({
    queryParams: { accountId }
  })

  const { mutate: updateSLO, loading: updateSLOLoading } = useUpdateSLOData({
    identifier,
    queryParams: { accountId, orgIdentifier, projectIdentifier }
  })

  const {
    data: SLODataResponse,
    error: SLODataError,
    refetch: refetchSLOData,
    loading: SLODataLoading
  } = useGetServiceLevelObjective({
    identifier,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })

  useEffect(() => {
    if (identifier) {
      refetchSLOData()
    }
  }, [identifier, refetchSLOData])

  const [openModal, closeModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        usePortal={true}
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        style={{
          width: 600,
          borderLeft: 0,
          paddingBottom: 0,
          paddingTop: 'large',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClose={closeModal}
      >
        <Layout.Vertical>
          <Layout.Horizontal>
            <Container width="70%" padding={{ right: 'large' }}>
              <Heading level={2} font={{ variation: FontVariation.H3 }} margin={{ bottom: 'xxlarge' }}>
                {getString('cv.slos.reviewChanges')}
              </Heading>
              <Text color={Color.GREY_600} font={{ weight: 'light' }} style={{ lineHeight: 'var(--spacing-xlarge)' }}>
                {getString('cv.slos.sloEditWarningMessage')}
              </Text>
            </Container>
            <Container margin={{ top: 'small' }}>
              <img width="170" src={sloReviewChange} />
            </Container>
          </Layout.Horizontal>

          <Layout.Horizontal spacing="medium" margin={{ top: 'large', bottom: 'xlarge' }}>
            <Button
              text={getString('common.ok')}
              onClick={async () => {
                await updateSLO(sloPayloadRef.current as ServiceLevelObjectiveDTO)
                sloPayloadRef.current = null
                showSuccess(getString('cv.slos.sloUpdated'))
                history.push(routes.toCVSLOs({ accountId, orgIdentifier, projectIdentifier, module: 'cv' }))
              }}
              intent="primary"
            />
            <Button
              text={getString('cancel')}
              onClick={() => {
                sloPayloadRef.current = null
                closeModal()
              }}
            />
          </Layout.Horizontal>
        </Layout.Vertical>
      </Dialog>
    ),
    [projectIdentifier, orgIdentifier, accountId]
  )

  const handleRedirect = (): void => {
    if (monitoredServiceIdentifier) {
      history.push({
        pathname: routes.toCVAddMonitoringServicesEdit({
          accountId,
          orgIdentifier,
          projectIdentifier,
          identifier: monitoredServiceIdentifier,
          module: 'cv'
        }),
        search: getCVMonitoringServicesSearchParam({ tab: MonitoredServiceEnum.SLOs })
      })
      return
    }

    history.push(routes.toCVSLOs({ accountId, orgIdentifier, projectIdentifier, module: 'cv' }))
  }

  const handleSLOSubmit = async (values: SLOForm): Promise<void> => {
    const sloCreateRequestPayload = createSLORequestPayload(values, orgIdentifier, projectIdentifier)

    try {
      if (identifier) {
        if (
          !getIsUserUpdatedSLOData(
            SLODataResponse?.resource?.serviceLevelObjective as ServiceLevelObjectiveDTO,
            sloCreateRequestPayload
          )
        ) {
          sloPayloadRef.current = sloCreateRequestPayload
          openModal()
        } else {
          await updateSLO(sloCreateRequestPayload)
          showSuccess(getString('cv.slos.sloUpdated'))
          handleRedirect()
        }
      } else {
        await createSLO(sloCreateRequestPayload)
        showSuccess(getString('cv.slos.sloCreated'))
        handleRedirect()
      }
    } catch (e) {
      showError(getErrorMessage(e))
    }
  }

  const links = [
    {
      url: routes.toCVSLOs({ accountId, orgIdentifier, projectIdentifier, module: 'cv' }),
      label: getString('cv.slos.title')
    }
  ]

  return (
    <>
      {!identifier && (
        <Page.Header
          breadcrumbs={<NGBreadcrumbs links={links} />}
          title={
            <Heading level={3} font={{ variation: FontVariation.H4 }}>
              {getString('cv.slos.createSLO')}
              <HarnessDocTooltip tooltipId={'createSLO'} useStandAlone />
            </Heading>
          }
        />
      )}
      <Formik<SLOForm>
        initialValues={getSLOInitialFormData(
          SLODataResponse?.resource?.serviceLevelObjective,
          monitoredServiceIdentifier
        )}
        formName="SLO_form"
        onSubmit={values => {
          handleSLOSubmit(values)
        }}
        validationSchema={getSLOFormValidationSchema(getString)}
        enableReinitialize
      >
        {formik => (
          <CreateSLOForm
            formikProps={formik}
            loading={SLODataLoading}
            error={getErrorMessage(SLODataError)}
            createOrUpdateLoading={createSLOLoading || updateSLOLoading}
            retryOnError={refetchSLOData}
            handleRedirect={handleRedirect}
          />
        )}
      </Formik>
    </>
  )
}

export default CVCreateSLO
