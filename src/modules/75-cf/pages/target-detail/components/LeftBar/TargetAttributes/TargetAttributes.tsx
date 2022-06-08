/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useStrings, UseStringsReturn } from 'framework/strings'
import type { Target } from 'services/cf'
import { ItemContainer } from '@cf/components/ItemContainer/ItemContainer'

import css from './TargetAttributes.module.scss'

export interface TargetAttributesProps {
  target: Target
}

function formatAttributeValue(getString: UseStringsReturn['getString'], value: boolean | string): string {
  if (typeof value === 'boolean') {
    return value ? getString('cf.shared.true') : getString('cf.shared.false')
  }

  return value
}

const TargetAttributes: React.FC<TargetAttributesProps> = ({ target }) => {
  const { getString } = useStrings()

  const attributes = useMemo<[string, string][]>(
    () =>
      Object.entries({
        [getString('identifier')]: target.identifier,
        [getString('name')]: target.name,
        ...target?.attributes
      }).map(([key, val]) => [key, formatAttributeValue(getString, val)]),
    [target.identifier, target.name, target?.attributes]
  )

  return (
    <dl className={css.list}>
      {attributes.map(([key, val]) => (
        <ItemContainer key={key}>
          <Text tag="dt" lineClamp={1} margin={{ bottom: 'xsmall' }} font={{ variation: FontVariation.FORM_LABEL }}>
            {key}
          </Text>
          <Text tag="dd" lineClamp={2} color={Color.GREY_800}>
            {val}
          </Text>
        </ItemContainer>
      ))}
    </dl>
  )
}

export default TargetAttributes
