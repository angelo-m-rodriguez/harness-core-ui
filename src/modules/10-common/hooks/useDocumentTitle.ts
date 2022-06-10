/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useDeepCompareEffect } from '@common/hooks/useDeepCompareEffect'

export type Title = string | string[]

export interface UseDocumentTitleReturn {
  updateTitle: (newTitle: Title) => void
}

export function useDocumentTitle(title: Title, accountLevel = false): UseDocumentTitleReturn {
  const { getString } = useStrings()
  const { selectedProject } = useAppStore()

  const getStringFromTitle = (str: Title): string => (Array.isArray(str) ? str.filter(s => s).join(' | ') : str)

  const updateTitle = (newTitle: Title): void => {
    const titleArray = [getStringFromTitle(newTitle), getString('harness')]

    if (!accountLevel && selectedProject?.name) {
      titleArray.splice(1, 0, selectedProject.name)
    }

    document.title = titleArray.filter(s => s).join(' | ')
  }

  useDeepCompareEffect(() => {
    updateTitle(title)

    return () => {
      // reset title on unmount
      document.title = getString('harness')
    }
  }, [title, selectedProject])

  return {
    updateTitle
  }
}
