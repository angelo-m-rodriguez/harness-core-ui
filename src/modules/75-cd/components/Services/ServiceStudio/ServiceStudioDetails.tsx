/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Tabs, Tab, Button, ButtonVariation, Layout, PageSpinner, useToaster } from '@harness/uicore'
import { cloneDeep, omit } from 'lodash-es'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { NGServiceConfig, useCreateServiceV2, useUpdateServiceV2 } from 'services/cd-ng'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useServiceContext } from '@cd/context/ServiceContext'
import ServiceConfiguration from './ServiceConfiguration/ServiceConfiguration'
import { ServiceTabs } from '../utils/ServiceUtils'
import css from '@cd/components/Services/ServiceStudio/ServiceStudio.module.scss'

interface ServiceStudioDetailsProps {
  serviceData: NGServiceConfig
  summaryPanel?: JSX.Element
  refercedByPanel?: JSX.Element
}
function ServiceStudioDetails(props: ServiceStudioDetailsProps): React.ReactElement | null {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { tab } = useQueryParams<{ tab: string }>()
  const { updateQueryParams } = useUpdateQueryParams()
  const {
    state: { isUpdated, pipelineView, isLoading },
    updatePipelineView,
    fetchPipeline,
    isReadonly
  } = usePipelineContext()

  const { isServiceEntityModalView, isServiceCreateModalView, onServiceCreate, onCloseModal } = useServiceContext()
  const [selectedTabId, setSelectedTabId] = useState(tab ?? ServiceTabs.SUMMARY)
  const { showSuccess, showError, clear } = useToaster()

  const { NG_SVC_ENV_REDESIGN } = useFeatureFlags()
  const handleTabChange = useCallback(
    (nextTab: ServiceTabs): void => {
      setSelectedTabId(nextTab)
      updateQueryParams({ tab: nextTab })
    },
    [updateQueryParams]
  )

  const { mutate: createService } = useCreateServiceV2({
    queryParams: {
      accountIdentifier: accountId
    },
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })
  const { mutate: updateService } = useUpdateServiceV2({
    queryParams: {
      accountIdentifier: accountId
    },
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const saveAndPublishService = async (): Promise<void> => {
    clear()
    const body = {
      ...omit(cloneDeep(props.serviceData.service), 'serviceDefinition', 'gitOpsEnabled'),
      projectIdentifier,
      orgIdentifier,
      yaml: yamlStringify({ ...props.serviceData })
    }

    try {
      const response = isServiceCreateModalView ? await createService(body) : await updateService(body)
      if (response.status === 'SUCCESS') {
        if (isServiceEntityModalView) {
          isServiceCreateModalView
            ? onServiceCreate?.({
                identifier: props.serviceData.service?.identifier as string,
                name: props.serviceData.service?.name as string
              })
            : onCloseModal?.()
        } else {
          showSuccess(getString('common.serviceCreated'))
          fetchPipeline({ forceFetch: true, forceUpdate: true })
        }
      } else {
        throw response
      }
    } catch (e: any) {
      showError(e?.data?.message || e?.message || getString('commonError'))
    }
  }

  if (isLoading) {
    return (
      <React.Fragment>
        <PageSpinner fixed />
        <div /> {/* this empty div is required for rendering layout correctly */}
      </React.Fragment>
    )
  }

  if (NG_SVC_ENV_REDESIGN) {
    if (isServiceEntityModalView) {
      return (
        <>
          <ServiceConfiguration serviceData={props.serviceData} />
          <Layout.Horizontal className={css.btnContainer} spacing="medium" margin={{ top: 'medium', bottom: 'medium' }}>
            <Button
              variation={ButtonVariation.PRIMARY}
              disabled={!isUpdated}
              text={getString('save')}
              onClick={saveAndPublishService}
              className={css.saveButton}
            />
            <Button text={getString('cancel')} variation={ButtonVariation.TERTIARY} onClick={onCloseModal} />
          </Layout.Horizontal>
        </>
      )
    }

    return (
      <Container padding={{ left: 'xlarge', right: 'xlarge' }} className={css.tabsContainer}>
        <Tabs id="serviceDetailsTab" selectedTabId={selectedTabId} onChange={handleTabChange}>
          <Tab id={ServiceTabs.SUMMARY} title={getString('summary')} panel={props.summaryPanel} />

          <Tab
            id={ServiceTabs.Configuration}
            title={getString('configuration')}
            panel={<ServiceConfiguration serviceData={props.serviceData} />}
          />

          <Tab id={ServiceTabs.REFERENCED_BY} title={getString('refrencedBy')} panel={props.refercedByPanel} />
          {/* <Tab id={ServiceTabs.ActivityLog} title={getString('activityLog')} panel={<></>} /> */}
        </Tabs>
        {selectedTabId === ServiceTabs.Configuration && (
          <Layout.Horizontal className={css.btnContainer}>
            {isUpdated && !isReadonly && <div className={css.tagRender}>{getString('unsavedChanges')}</div>}
            <Button
              variation={ButtonVariation.PRIMARY}
              disabled={!isUpdated}
              text={getString('save')}
              onClick={saveAndPublishService}
              className={css.saveButton}
            />
            <Button
              disabled={!isUpdated}
              onClick={() => {
                updatePipelineView({ ...pipelineView, isYamlEditable: false })
                fetchPipeline({ forceFetch: true, forceUpdate: true })
              }}
              className={css.discardBtn}
              variation={ButtonVariation.SECONDARY}
              text={getString('pipeline.discard')}
            />
          </Layout.Horizontal>
        )}
      </Container>
    )
  }

  return (
    <Container padding={{ left: 'xlarge', right: 'xlarge' }} className={css.tabsContainer}>
      <Tabs id="serviceDetailsTab" selectedTabId={selectedTabId} onChange={handleTabChange}>
        <Tab id={ServiceTabs.SUMMARY} title={getString('summary')} panel={props.summaryPanel} />
        <Tab id={ServiceTabs.REFERENCED_BY} title={getString('refrencedBy')} panel={props.refercedByPanel} />
      </Tabs>
    </Container>
  )
}

export default ServiceStudioDetails
