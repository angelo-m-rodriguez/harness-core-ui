/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { CardSelect, Container, Text, Layout, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { DelegateTypes } from '@delegates/constants'
import type { CardData } from '../DelegateSelectStep'

import Docker from './Icons/docker.svg'
import Ecs from './Icons/ecs.svg'
import Linux from './Icons/linux.svg'
import css from './Delegates4Ways.module.scss'

interface Delegates4WaysProps {
  onSelect: (value: CardData) => void
  selectedCard: CardData | undefined
  selectCardData: CardData[]
}

const allowedDelegateTypes = [DelegateTypes.KUBERNETES_CLUSTER, DelegateTypes.DOCKER]

const Delegates4Ways: React.FC<Delegates4WaysProps> = props => {
  const { onSelect, selectedCard, selectCardData } = props

  const getIcon = (type: string) => {
    switch (type) {
      case DelegateTypes.LINUX:
        return Linux
      case DelegateTypes.ECS:
        return Ecs
      case DelegateTypes.DOCKER:
        return Docker
    }
  }

  return (
    <CardSelect
      data={selectCardData}
      cornerSelected={true}
      selected={selectedCard}
      renderItem={item => {
        const isDelegateTypeAllowed = allowedDelegateTypes.includes(item.type)

        return (
          <Container
            className={cx(css.cardBody, { [css.disableCursor]: !isDelegateTypeAllowed })}
            data-type={item.type}
          >
            {item.type !== DelegateTypes.KUBERNETES_CLUSTER && <img src={getIcon(item.type)} />}
            {item.type === DelegateTypes.KUBERNETES_CLUSTER && (
              <Icon name="service-kubernetes" size={20} className={css.kubIcon} />
            )}
            <Layout.Vertical className={css.cardContent}>
              <Text font={{ weight: 'bold' }} color={Color.GREY_900} className={css.cardHeader}>
                {item.name}
              </Text>
              <Text
                style={{
                  color: '#6B6D85'
                }}
                className={css.subTitle}
              >
                {item.text}
              </Text>
            </Layout.Vertical>
          </Container>
        )
      }}
      onChange={value => {
        if (allowedDelegateTypes.includes(value.type)) {
          /* istanbul ignore next */
          onSelect(value)
        }
      }}
      className={`grid ${css.cardWrapper}`}
    ></CardSelect>
  )
}

export default Delegates4Ways
