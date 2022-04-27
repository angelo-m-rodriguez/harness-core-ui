/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { Layout, PageSpinner } from '@harness/uicore'

import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { Page } from '@common/exports'
import type { ProjectPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'
import { useStrings } from 'framework/strings'

import EmptyNodeView from '@filestore/components/EmptyNodeView/EmptyNodeView'
import StoreExplorer from '@filestore/components/StoreExplorer/StoreExplorer'
import StoreView from '@filestore/components/StoreView/StoreView'
import { FileStoreContext, FileStoreContextProvider } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FILE_STORE_ROOT } from '@filestore/utils/constants'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import { useGetFolderNodes } from 'services/cd-ng'

const FileStore: React.FC = () => {
  const params = useParams<PipelineType<ProjectPathProps>>()
  const { accountId, orgIdentifier, projectIdentifier } = params
  const { getString } = useStrings()

  const { fileStore, setFileStore, setCurrentNode } = useContext(FileStoreContext)

  const { mutate: getRootNodes, loading } = useGetFolderNodes({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    }
  })
  useEffect(() => {
    getRootNodes({ identifier: FILE_STORE_ROOT, name: FILE_STORE_ROOT, type: FileStoreNodeTypes.FOLDER }).then(
      response => {
        if (response?.data?.children) {
          setFileStore(response.data.children)
          setCurrentNode(response.data)
        }
      }
    )
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
        {loading ? (
          <PageSpinner />
        ) : (
          <>
            {!fileStore?.length ? (
              <EmptyNodeView
                title={getString('filestore.noFilesInStore')}
                description={getString('filestore.noFilesTitle')}
              />
            ) : (
              <Layout.Horizontal height="100%">
                <StoreExplorer fileStore={fileStore} />
                <StoreView />
              </Layout.Horizontal>
            )}
          </>
        )}
      </Page.Body>
    </>
  )
}

export default function FileStorePage(): React.ReactElement {
  return (
    <FileStoreContextProvider>
      <FileStore />
    </FileStoreContextProvider>
  )
}
