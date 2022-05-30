/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, SetStateAction } from 'react'
import { Tooltip } from '@blueprintjs/core'

import { Checkbox, Layout, Color } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { StoreType } from '@common/constants/GitSyncTypes'

import { useAppStore } from 'framework/AppStore/AppStoreContext'
import css from './RunPipelineForm.module.scss'

export interface CheckBoxActionsProps {
  executionView?: boolean
  skipPreFlightCheck: boolean
  setSkipPreFlightCheck: Dispatch<SetStateAction<boolean>>
  notifyOnlyMe: boolean
  setNotifyOnlyMe: Dispatch<SetStateAction<boolean>>
  storeType: StoreType
}

export default function CheckBoxActions(props: CheckBoxActionsProps): React.ReactElement | null {
  const { executionView, skipPreFlightCheck, setSkipPreFlightCheck, notifyOnlyMe, setNotifyOnlyMe, storeType } = props
  const { getString } = useStrings()
  const { isGitSimplificationEnabled } = useAppStore()

  if (executionView) {
    return null
  }

  return (
    <Layout.Horizontal padding={{ left: 'xlarge', right: 'xlarge', top: 'medium', bottom: 'medium' }}>
      <Checkbox
        label={getString('pre-flight-check.skipCheckBtn')}
        background={Color.GREY_100}
        color={skipPreFlightCheck ? Color.PRIMARY_8 : Color.BLACK}
        className={css.footerCheckbox}
        padding={{ top: 'small', bottom: 'small', left: 'xxlarge', right: 'medium' }}
        checked={skipPreFlightCheck}
        onChange={e => setSkipPreFlightCheck(e.currentTarget.checked)}
        disabled={isGitSimplificationEnabled && storeType === StoreType.REMOTE}
      />
      <Tooltip position="top" content={getString('featureNA')}>
        <Checkbox
          background={notifyOnlyMe ? Color.PRIMARY_2 : Color.GREY_100}
          color={notifyOnlyMe ? Color.PRIMARY_7 : Color.BLACK}
          className={css.footerCheckbox}
          margin={{ left: 'medium' }}
          padding={{ top: 'small', bottom: 'small', left: 'xxlarge', right: 'medium' }}
          disabled
          label={getString('pipeline.runPipelineForm.notifyOnlyMe')}
          checked={notifyOnlyMe}
          onChange={e => setNotifyOnlyMe(e.currentTarget.checked)}
        />
      </Tooltip>
    </Layout.Horizontal>
  )
}
