/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'

import { useStrings } from 'framework/strings'
import UploadAddIcon from '@filestore/images/upload.svg'
import { ComponentRenderer } from '@filestore/common/ModalComponents/ModalComponents'
import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'

const useUploadFile = (): FileStorePopoverItem => {
  const { getString } = useStrings()
  const [file, setFile] = useState<File>()
  // const [content, setContent] = useState<string | ArrayBuffer>('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (file) {
      const data = new FormData()
      data.append('title', 'file')

      data.append('File', file)
      // const reader = new FileReader()
      // reader.addEventListener('load', e => {
      //   if (e?.target?.result) {
      //     setContent(e.target.result)
      //   }
      // })
    }
  }, [file])

  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.setAttribute('directory', '')
      inputRef.current.setAttribute('webkitdirectory', '')
    }
  }, [inputRef])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | any>): void => {
    if (!event.target.files?.length) {
      return
    } else {
      setFile(event.target.files[0])
    }
  }

  const handleClick = useCallback(() => {
    if (inputRef.current !== null) {
      inputRef.current.click()
    }
  }, [inputRef])

  const RenderUpload = (): React.ReactElement => {
    return (
      <>
        <ComponentRenderer iconSrc={UploadAddIcon} title={getString('filestore.uploadFileFolder')} />
        <input id="file-upload" name="file" type="file" onChange={handleChange} ref={inputRef} multiple hidden />
      </>
    )
  }

  return {
    ComponentRenderer: <RenderUpload />,
    onClick: handleClick,
    label: getString('filestore.uploadFileFolder')
  }
}

export default useUploadFile
