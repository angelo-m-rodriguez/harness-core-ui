/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { FileUsage } from '@filestore/interfaces/FileStore'

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
