/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { FileStoreNodeDTO } from 'services/cd-ng'
import type { Item as NodeMenuOptionItem } from '@filestore/common/NodeMenu/NodeMenuButton'
import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'

import { FileStoreNodeTypes, FileUsage } from '@filestore/interfaces/FileStore'
import { ExtensionType, LanguageType, FSErrosType, FileStoreActionTypes } from './constants'

export const firstLetterToUpperCase = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`

export const getFileUsageNameByType = (type: FileUsage): string => {
  switch (type) {
    case FileUsage.MANIFEST_FILE:
      return 'Manifest'
    case FileUsage.CONFIG:
      return 'Config'
    case FileUsage.SCRIPT:
      return 'Script'
    default:
      return ''
  }
}

export const getMimeTypeByName = (name: string): string => {
  const splitedFileName = name.split('.')
  if (splitedFileName.length <= 1) {
    return ExtensionType.TEXT
  }
  return splitedFileName[splitedFileName.length - 1]
}

export const getLanguageType = (lang: string | undefined): string => {
  switch (lang) {
    case ExtensionType.YAML:
      return LanguageType.YAML
    case LanguageType.JSON:
      return ExtensionType.JSON
    case ExtensionType.BASH:
      return LanguageType.BASH
    case ExtensionType.POWER_SHELL:
      return LanguageType.POWER_SHELL
    case ExtensionType.TEXT:
      return LanguageType.TEXT
    default:
      return LanguageType.TEXT
  }
}

export const checkSupportedMime = (mime: ExtensionType): boolean => {
  return Object.values(ExtensionType).includes(mime)
}

export const getFSErrorByType = (type: FSErrosType): string => {
  switch (type) {
    case FSErrosType.UNSUPPORTED_FORMAT:
      return 'filestore.errors.cannotRender'
    case FSErrosType.FILE_USAGE:
      return 'filestore.errors.fileUsage'
    default:
      return ''
  }
}

export const existCachedNode = (
  tempNodes: FileStoreNodeDTO[],
  nodeIdentifier: string
): FileStoreNodeDTO | undefined => {
  return tempNodes.find((tempNode: FileStoreNodeDTO): boolean => tempNode.identifier === nodeIdentifier)
}

type FileStorePopoverOptionItem = FileStorePopoverItem | '-'

export const getMenuOptionItems = (
  optionItems: FileStorePopoverOptionItem[],
  type?: FileStoreNodeTypes
): NodeMenuOptionItem[] => {
  const { DELETE_NODE, CREATE_NODE, UPDATE_NODE, UPLOAD_NODE } = FileStoreActionTypes
  const ACTIONS =
    type === FileStoreNodeTypes.FOLDER
      ? [DELETE_NODE, CREATE_NODE, UPDATE_NODE, UPLOAD_NODE, '-']
      : [DELETE_NODE, UPDATE_NODE]
  const FILTERED_ACTIONS = optionItems.filter((optionItem: FileStorePopoverOptionItem): boolean => {
    if (optionItem === '-') {
      return true
    }
    return ACTIONS.includes(optionItem.actionType)
  })

  return FILTERED_ACTIONS.map((optionItem: FileStorePopoverOptionItem) => {
    if (optionItem === '-') {
      return optionItem
    }
    return {
      text: optionItem.ComponentRenderer,
      onClick: optionItem.onClick
    }
  })
}
