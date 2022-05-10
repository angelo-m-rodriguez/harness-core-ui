/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, {useCallback, useContext} from 'react'

import {Icon} from '@harness/uicore'
import {Text, useConfirmationDialog, useToaster} from "@wings-software/uicore";
import {Intent} from "@blueprintjs/core";
import {useParams} from "react-router-dom";
import {capitalize as _capitalize, defaultTo as _defaultTo, lowerCase as _lowerCase} from 'lodash-es'
import {String, useStrings} from 'framework/strings'
import {FileStoreNodeDTO, useDeleteFile} from "services/cd-ng";
import type {FileStorePopoverItem} from "@filestore/common/FileStorePopover/FileStorePopover";
import type {ProjectPathProps} from "@common/interfaces/RouteInterfaces";
import {FileStoreContext} from "@filestore/components/FileStoreContext/FileStoreContext";
import {FILE_VIEW_TAB, FileStoreNodeTypes} from "@filestore/interfaces/FileStore";
import {FILE_STORE_ROOT} from "@filestore/utils/constants";
import {ComponentRenderer} from '../ModalComponents/ModalComponents'

const useDelete = (identifier: string, name: string, type: string): FileStorePopoverItem => {
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { setActiveTab, setCurrentNode, getNode } = useContext(FileStoreContext)
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  const getConfirmationDialogContent = (): JSX.Element => {
    return (
        <div className={'filestoreDeleteDialog'}>
          <String useRichText stringID="filestore.confirmDeleteFile" vars={{
            entity: _lowerCase(type),
            name: name }} />
        </div>
    )
  }

  const { mutate: deleteFile } = useDeleteFile({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    }
  })

  const { openDialog: openReferenceErrorDialog } = useConfirmationDialog({
    contentText: (
        <span>
          <Text inline font={{ weight: 'bold' }}>
            {`${name} `}
          </Text>
          {getString('filestore.fileReferenceText')}
        </span>
    ),
    titleText: getString('filestore.cantDeleteFile'),
    confirmButtonText: type === 'FILE' ? getString('filestore.referenceButtonText') : undefined,
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        setCurrentNode({
          identifier,
          name,
          type: 'FILE',
          children: []
        } as FileStoreNodeDTO)
        setActiveTab(FILE_VIEW_TAB.REFERENCED_BY)
      }
    }
  })

  const handleFileDeleteError = (code: string, message: string): void => {
    if (code === 'ENTITY_REFERENCE_EXCEPTION') {
      openReferenceErrorDialog()
    } else {
      showError(message)
    }
  }

  const { openDialog } = useConfirmationDialog({
    contentText: getConfirmationDialogContent(),
    titleText: `${getString('delete')} ${_capitalize(type)}?`,
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        try {
          const deleted = await deleteFile(identifier || '', {
            headers: { 'content-type': 'application/json' }
          })

          if (deleted) {
            showSuccess(getString('filestore.deletedSuccessMessage', { name: name, type: _capitalize(type) }))
            getNode({
                identifier: FILE_STORE_ROOT,
                name: FILE_STORE_ROOT,
                type: FileStoreNodeTypes.FOLDER,
                children: []
            } as FileStoreNodeDTO)
          }
        } catch (err) {
          handleFileDeleteError(err?.data.code, _defaultTo(err?.data?.message, err?.message))
        }
      }
    }
  })

  const handleClick = useCallback(() => {
    openDialog()
  }, [openDialog])

  const icon = <Icon name="main-trash" />

  return {
    ComponentRenderer: <ComponentRenderer icon={icon} title={getString('delete')} />,
    onClick: handleClick,
    label: getString('delete')
  }
}

export default useDelete
