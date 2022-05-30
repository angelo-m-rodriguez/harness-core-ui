/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import type { Cell } from 'react-table'
import { Button, ButtonVariation } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { Feature } from 'services/cf'

import css from './FlagsListing.module.scss'

const DeleteFlagButtonCell: FC<Cell<Feature>> = ({ value: { onRowDelete, ReasonTooltip } }) => {
  const { getString } = useStrings()

  return (
    <div className={css.alignRight}>
      <ReasonTooltip>
        <Button
          icon="trash"
          variation={ButtonVariation.ICON}
          aria-label={getString('cf.targetManagementFlagConfiguration.removeFlag')}
          onClick={e => {
            e.preventDefault()
            onRowDelete()
          }}
        />
      </ReasonTooltip>
    </div>
  )
}

export default DeleteFlagButtonCell
