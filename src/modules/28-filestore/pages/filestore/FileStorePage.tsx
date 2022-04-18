/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '@wings-software/uicore'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { Page } from '@common/exports'
import type { ProjectPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'
import { useStrings } from 'framework/strings'
import NoFilesView from '@filestore/components/NoFilesView/NoFilesView'
import StoreExplorer from '@filestore/components/StoreExplorer/StoreExplorer'
import StoreView from '@filestore/components/StoreView/StoreView'

const FileStorePage: React.FC = () => {
  const params = useParams<PipelineType<ProjectPathProps>>()
  const { accountId, orgIdentifier, projectIdentifier } = params
  const { getString } = useStrings()
  const [fileStore, setFileStore] = useState<string[]>([])

  useEffect(() => {
    setTimeout(() => {
      setFileStore([' a'])
    }, 50000)
  }, [])

  return (
    <>
      <Page.Header
        breadcrumbs={
          <NGBreadcrumbs
            links={getLinkForAccountResources({ accountId, orgIdentifier, projectIdentifier, getString })}
          />
        }
        title={getString('resourcePage.fileStore')}
      />
      <Page.Body>
        {!fileStore.length ? (
          <NoFilesView
            title={getString('filestore.noFilesInStore')}
            description={getString('filestore.noFilesTitle')}
          />
        ) : (
          <Layout.Horizontal height="100%">
            <StoreExplorer />
            <StoreView />
          </Layout.Horizontal>
        )}
      </Page.Body>
    </>
  )
}

export default FileStorePage
