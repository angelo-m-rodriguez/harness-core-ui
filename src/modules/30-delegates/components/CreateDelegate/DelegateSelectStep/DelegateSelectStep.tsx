/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'

import { Layout, StepProps, Button, Text, Container } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'

import { DelegateTypes } from '@delegates/constants'
import type { DelegateInfoDTO, DelegateConfigDTO } from '@delegates/DelegateInterface'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, DelegateActions } from '@common/constants/TrackingConstants'

import Delegates4Ways from './Delegates4Ways/Delegates4Ways'
import harnessDelegate from './images/harness-delegate.svg'

import K8sPrerequisites from './Prerequisites/K8sPrerequisites/K8sPrerequisites'
import DockerPrerequisites from './Prerequisites/DockerPrerequisites/DockerPrerequisites'

import css from './DelegateSelectStep.module.scss'

interface DelegateSelectStepProps extends StepProps<DelegateConfigDTO> {
  type: string
  name: string
  delegateInfo?: DelegateConfigDTO | void
  detailsData?: string
  onClick?: any
}
export interface CardData {
  text: string
  value: string
  icon: string
  name: string
  type: string
}

const getPrereqisites = (selectedCard: CardData) => {
  switch (selectedCard.type) {
    case DelegateTypes.KUBERNETES_CLUSTER: {
      return <K8sPrerequisites />
    }
    case DelegateTypes.DOCKER: {
      return <DockerPrerequisites />
    }
    default:
      return null
  }
}

const DelegateSelectStep: React.FC<StepProps<DelegateInfoDTO> & DelegateSelectStepProps> = props => {
  const { getString } = useStrings()

  const selectCardData: CardData[] = [
    {
      text: getString('delegate.cardData.docker.text'),
      value: getString('delegate.cardData.docker.value'),
      icon: getString('delegate.cardData.docker.icon'),
      name: getString('delegate.cardData.docker.name'),
      type: DelegateTypes.DOCKER
    },
    {
      text: getString('delegate.cardData.kubernetes.text'),
      value: getString('delegate.cardData.kubernetes.value'),
      icon: getString('delegate.cardData.kubernetes.icon'),
      name: getString('kubernetesText'),
      type: DelegateTypes.KUBERNETES_CLUSTER
    },
    {
      text: getString('delegate.cardData.amazonECS.text'),
      value: getString('delegate.cardData.amazonECS.value'),
      icon: getString('delegate.cardData.amazonECS.icon'),
      name: getString('delegate.cardData.amazonECS.name'),
      type: DelegateTypes.ECS
    },
    {
      text: getString('delegate.cardData.linux.text'),
      value: getString('delegate.cardData.linux.value'),
      icon: getString('delegate.cardData.linux.icon'),
      name: getString('delegate.cardData.linux.name'),
      type: DelegateTypes.LINUX
    }
  ]

  const [selectedCard, setSelectedCard] = useState<CardData>()

  useEffect(() => {
    if (props.type) {
      setSelectedCard(selectCardData.find(card => card.type === props.type))
    } else {
      setSelectedCard(selectCardData[0])
    }
  }, [])

  const { trackEvent } = useTelemetry()

  useTrackEvent(DelegateActions.StartCreateDelegate, {
    category: Category.DELEGATE
  })

  return (
    <>
      <Layout.Horizontal spacing="large">
        <Container flex style={{ justifyContent: 'center', height: '220px', flexGrow: 1, background: '#0A3364' }}>
          <img src={harnessDelegate} alt="" aria-hidden />
        </Container>
      </Layout.Horizontal>
      <Container className={css.delegateSelectStep}>
        <div className={css.section1}>
          <Text color={Color.GREY_800} font={{ size: 'normal', align: 'left' }} className={css.detailsSectionRow}>
            {getString('delegate.delegates_4_ways_title')}
          </Text>
          <Delegates4Ways onSelect={setSelectedCard} selectedCard={selectedCard} selectCardData={selectCardData} />
        </div>
        <div className={css.verticalLine}></div>
        <div className={css.section2}>
          {selectedCard && getPrereqisites(selectedCard)}
          <Container>
            <Button
              id="step1ContinueButton"
              intent="primary"
              text="Continue"
              className={css.continueBtn}
              rightIcon="chevron-right"
              onClick={() => {
                /* istanbul ignore next */
                props?.onClick(selectedCard)
                trackEvent(DelegateActions.SelectDelegateType, {
                  category: Category.DELEGATE,
                  selectedCard: selectedCard?.type
                })
              }}
              disabled={selectedCard ? false : true}
            />
          </Container>
        </div>
      </Container>
    </>
  )
}

export default DelegateSelectStep
