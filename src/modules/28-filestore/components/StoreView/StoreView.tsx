/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useContext } from 'react'
import { Container } from '@wings-software/uicore'
import EmptyNodeView from '@filestore/components/EmptyNodeView/EmptyNodeView'
import { useStrings } from 'framework/strings'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'

export default function StoreView(): React.ReactElement {
  const { getString } = useStrings()
  const { currentNode } = useContext(FileStoreContext)

  return (
    <Container padding="xlarge" style={{ width: '100%' }}>
      {currentNode?.type === FileStoreNodeTypes.FOLDER && !currentNode?.children?.length && (
        <EmptyNodeView title={getString('filestore.noFilesInFolderTitle')} />
      )}
    </Container>
  )
}
