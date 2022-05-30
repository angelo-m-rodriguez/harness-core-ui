/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import type { Cell } from 'react-table'
import { FormInput } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { Feature } from 'services/cf'

const AddFlagCheckboxCell: FC<Cell<Feature>> = ({ row: { original: flag } }) => {
  const { getString } = useStrings()

  return (
    <FormInput.CheckBox
      label=""
      aria-label={getString('cf.segmentDetail.addFlagNameToTargetGroup', { flagName: flag.name })}
      name={`flags.${flag.identifier}.added`}
      style={{ margin: 0 }}
    />
  )
}

export default AddFlagCheckboxCell
