/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { FileStoreNodeDTO } from 'services/cd-ng'

export enum FileStoreNodeTypes {
  FILE = 'FILE',
  FOLDER = 'FOLDER'
}

export enum FileUsage {
  MANIFEST_FILE = 'MANIFEST_FILE',
  CONFIG = 'CONFIG',
  SCRIPT = 'SCRIPT'
}

export interface NewFolderDTO {
  name: string
  identifier: string
  type: FileStoreNodeTypes | string
}

export interface NewFileDTO extends NewFolderDTO {
  fileUsage: string
  description?: string
  tags?: {
    [key: string]: string
  }
}

export type NewFileFormDTO = Omit<NewFileDTO, 'type'>

export enum FileStoreRoot {
  Root
}

export type StoreNodeType = 'FILE' | 'FOLDER'

export interface NewNodeConfig {
  parentIdentifier: string
  callback: (node: FileStoreNodeDTO) => void
}

export interface NewNodeModal extends NewNodeConfig {
  type: StoreNodeType
}
