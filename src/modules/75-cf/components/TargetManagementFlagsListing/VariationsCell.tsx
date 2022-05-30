/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, ReactElement, useMemo } from 'react'
import { FormInput, SelectOption } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { Feature } from 'services/cf'
import { CFVariationColors } from '@cf/constants'

import css from './VariationsCell.module.scss'

export interface VariationsCellProps {
  row: { original: Feature }
  value: {
    disabled?: boolean
    ReasonTooltip?: FC
  }
}

const VariationsCell: FC<VariationsCellProps> = ({
  row: { original: flag },
  value: { disabled, ReasonTooltip = ({ children }) => children as ReactElement }
}) => {
  const { getString } = useStrings()

  const variations = useMemo<SelectOption[]>(
    () =>
      flag.variations.map<SelectOption>(({ identifier, name }, index) => ({
        label: name || identifier,
        value: identifier,
        icon: {
          name: 'full-circle',
          style: { color: CFVariationColors[index] }
        }
      })),
    [flag.variations]
  )

  return (
    <ReasonTooltip>
      <FormInput.Select
        placeholder={getString('cf.segmentDetail.selectVariation')}
        name={`flags.${flag.identifier}.variation`}
        items={variations}
        disabled={disabled}
        className={css.input}
      />
    </ReasonTooltip>
  )
}

export default VariationsCell
