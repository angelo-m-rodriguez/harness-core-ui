/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import { Dialog } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { useStrings } from 'framework/strings'
import type { ScopedObjectDTO } from '@common/components/EntityReference/EntityReference'
import ProjectSelection from './views/ProjectSelection'

export interface UseProjectSelectionModalProps {
  onSuccess: (projects: string[]) => void
  onCloseModal?: () => void
}

export interface UseProjectSelectionModalReturn {
  openProjectSelectionModal: (projects: string[], scope: ScopedObjectDTO) => void
  closeProjectSelectionModal: () => void
}

export const useProjectSelectionModal = ({
  onSuccess
}: UseProjectSelectionModalProps): UseProjectSelectionModalReturn => {
  const [projectSelectionData, setProjectSelectionData] = useState<string[]>([])
  const [scope, setScope] = useState<ScopedObjectDTO>({})
  const { getString } = useStrings()
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        title={`${getString('add')} ${getString('projectsText')}`}
        onClose={hideModal}
        style={{
          width: 800
        }}
      >
        <ProjectSelection
          scope={scope}
          selectedData={projectSelectionData}
          onSuccess={projects => {
            onSuccess(projects)
            hideModal()
          }}
          onClose={hideModal}
        />
      </Dialog>
    ),
    [scope, projectSelectionData, onSuccess]
  )
  const open = useCallback(
    (_projects: string[], _scope: ScopedObjectDTO) => {
      setProjectSelectionData(_projects)
      setScope(_scope)
      showModal()
    },
    [showModal]
  )
  return {
    openProjectSelectionModal: open,
    closeProjectSelectionModal: hideModal
  }
}
