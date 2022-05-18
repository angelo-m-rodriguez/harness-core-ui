/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useEffect, useCallback, useContext } from 'react'

import { v4 as uuid } from 'uuid'
import { useToaster } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import UploadAddIcon from '@filestore/images/upload.svg'
import { ComponentRenderer } from '@filestore/common/ModalComponents/ModalComponents'
import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import { FileStoreActionTypes, FILE_STORE_ROOT } from '@filestore/utils/constants'
import type { FileStoreNodeDTO } from '@filestore/components/FileStoreContext/FileStoreContext'
import { checkSupportedMime } from '@filestore/utils/textUtils'

interface UploadFile {
  isBtn?: boolean
  eventMethod?: string
}

export const UPLOAD_EVENTS = {
  UPLOAD: 'UPLOAD',
  REPLACE: 'REPLACE'
}

const useUploadFile = (config: UploadFile): FileStorePopoverItem => {
  const { isBtn = false, eventMethod = UPLOAD_EVENTS.UPLOAD } = config
  const { showError } = useToaster()
  const { getString } = useStrings()
  const {
    setCurrentNode,
    currentNode,
    setFileStore,
    fileStore,
    updateCurrentNode,
    tempNodes,
    setTempNodes,
    updateTempNodes
  } = useContext(FileStoreContext)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.setAttribute('directory', '')
      inputRef.current.setAttribute('webkitdirectory', '')
    }
  }, [inputRef])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | any>): void => {
    if (currentNode.type !== FileStoreNodeTypes.FOLDER && eventMethod === UPLOAD_EVENTS.UPLOAD) {
      showError('Folder should be selected')
      return
    }
    if (currentNode.tempNode) {
      updateCurrentNode({
        ...currentNode,
        content: ''
      })
    }
    if (!event.target.files?.length) {
      return
    } else {
      if (event.target.files[0]) {
        const { name } = event.target.files[0]
        const mimeType = name.split('.')[name.split('.').length - 1]
        const isSupportedMime = checkSupportedMime(mimeType)

        const reader = new FileReader()
        if (!isSupportedMime) {
          reader.readAsDataURL(event.target.files[0])
        } else {
          reader.readAsText(event.target.files[0])
        }

        reader.onload = function () {
          const existNode = currentNode?.children && currentNode.children.find(node => node.identifier === name)

          if (typeof reader.result === 'string') {
            const uniqID = `${name}_${uuid()}`
            const node: FileStoreNodeDTO = {
              name,
              identifier: `${uniqID.replace(/[^A-Z0-9]+/gi, '_')}`,
              type: FileStoreNodeTypes.FILE,
              mimeType,
              content: reader.result,
              parentIdentifier: currentNode.identifier,
              parentName: currentNode.name
            }
            if (eventMethod === UPLOAD_EVENTS.REPLACE) {
              updateCurrentNode({
                ...node,
                identifier: currentNode.identifier,
                content: reader.result,
                parentIdentifier: currentNode.parentIdentifier
              })
              if (tempNodes?.length) {
                updateTempNodes({
                  ...node,
                  identifier: currentNode.identifier,
                  parentIdentifier: currentNode.parentIdentifier
                })
              }
              return
            }
            if (currentNode.type === FileStoreNodeTypes.FOLDER && currentNode?.children && !existNode) {
              if (currentNode.identifier !== FILE_STORE_ROOT) {
                updateCurrentNode({
                  ...currentNode,
                  children: [...currentNode.children, node]
                })
                setCurrentNode(node)
                setTempNodes([...tempNodes, node])
              } else if (fileStore) {
                setFileStore([node, ...fileStore])
                updateCurrentNode({
                  ...currentNode,
                  children: [node, ...currentNode.children]
                })
                setCurrentNode(node)
                setTempNodes([...tempNodes, node])
              }
            }
            if (currentNode.type === FileStoreNodeTypes.FILE && fileStore) {
              setFileStore([{ ...node, parentIdentifier: FILE_STORE_ROOT }, ...fileStore])
              setCurrentNode({
                ...node,
                parentIdentifier: FILE_STORE_ROOT
              })
              setTempNodes([...tempNodes, node])
            }
          }
        }
      }
    }
  }

  const handleClick = useCallback(() => {
    if (inputRef.current !== null) {
      inputRef.current.click()
    }
  }, [inputRef])

  const RenderUploadBtn = (): React.ReactElement => {
    return (
      <>
        <input id="file-upload" name="file" type="file" onChange={handleChange} ref={inputRef} hidden />
      </>
    )
  }

  const RenderUpload = (): React.ReactElement => {
    return (
      <>
        <ComponentRenderer iconSrc={UploadAddIcon} title={getString('filestore.uploadFileFolder')} />
        <input id="file-upload" name="file" type="file" onChange={handleChange} ref={inputRef} hidden />
      </>
    )
  }

  if (isBtn) {
    return {
      ComponentRenderer: <RenderUploadBtn />,
      onClick: handleClick,
      label: getString('filestore.view.replaceFile'),
      actionType: FileStoreActionTypes.UPLOAD_NODE
    }
  }

  return {
    ComponentRenderer: <RenderUpload />,
    onClick: handleClick,
    label: getString('filestore.uploadFileFolder'),
    actionType: FileStoreActionTypes.UPLOAD_NODE
  }
}

export default useUploadFile
