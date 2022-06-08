/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, Heading, Layout, StepProps, CardSelect, Icon, IconName, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { ConnectorInfoDTO } from 'services/cd-ng'

import { CE_K8S_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import css from './CEK8sConnector.module.scss'

enum Features {
  VISIBILITY,
  OPTIMIZATION
}

export type FeaturesString = keyof typeof Features

interface CardData {
  icon: IconName
  text: string
  value: FeaturesString
  heading: string
  subheading: string
}

interface StepSecretManagerProps extends ConnectorInfoDTO {
  spec: any
}

interface FeatureSelectionStepProps {
  name: string
  isEditMode: boolean
  handleOptimizationSelection: (val: boolean) => void
}

const FeatureSelectionStep: React.FC<StepProps<StepSecretManagerProps> & FeatureSelectionStepProps> = props => {
  const { getString } = useStrings()

  useStepLoadTelemetry(CE_K8S_CONNECTOR_CREATION_EVENTS.LOAD_FEATURE_SELECTION)

  const { prevStepData, nextStep, previousStep } = props

  const cardData: CardData[] = [
    {
      icon: 'main-main-zoom_in',
      text: getString('connectors.ceK8.chooseRequirements.visibility.description'),
      value: 'VISIBILITY',
      heading: getString('connectors.ceK8.chooseRequirements.visibility.heading'),
      subheading: getString('connectors.ceK8.chooseRequirements.visibility.subheading')
    },
    {
      icon: 'gear',
      text: getString('connectors.ceK8.chooseRequirements.optimization.description'),
      value: 'OPTIMIZATION',
      heading: getString('connectors.ceK8.chooseRequirements.optimization.heading'),
      subheading: getString('connectors.ceK8.chooseRequirements.optimization.subheading')
    }
  ]

  const [cardsSelected, setCardsSelected] = useState<CardData[]>(
    prevStepData?.spec.featuresEnabled
      ? prevStepData?.spec?.featuresEnabled.map((feat: FeaturesString) => {
          const num = Features[feat]
          return cardData[num]
        })
      : [cardData[0]]
  )

  const handleSubmit = async () => {
    const featuresEnabled: FeaturesString[] = cardsSelected.map(card => card.value)

    trackEvent(ConnectorActions.FeatureSelectionStepSubmit, {
      category: Category.CONNECTOR
    })

    // enable Secret creation step if OPTIMIZATION is selected
    await props.handleOptimizationSelection(featuresEnabled.indexOf('OPTIMIZATION') > -1)

    const newspec = {
      ...prevStepData?.spec,
      featuresEnabled
    }
    const payload = prevStepData
    if (payload) payload.spec = newspec
    nextStep?.(payload)
  }

  const handleprev = () => {
    previousStep?.({ ...prevStepData } as ConnectorInfoDTO)
  }

  const handleCardSelection = (item: CardData) => {
    // return for VISIBLIITY feature
    if (prevStepData?.spec?.fixFeatureSelection || item.value === Features[0]) return
    const selectedAr = [...cardsSelected]
    const index = selectedAr.map(i => i.value).indexOf(item.value)
    if (index > -1) {
      selectedAr.splice(index, 1)
    } else {
      selectedAr.push(item)
    }
    setCardsSelected(selectedAr)
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.FeatureSelectionStepLoad, {
    category: Category.CONNECTOR
  })

  return (
    <Layout.Vertical className={css.featureSelectionCont}>
      <Heading level={2} className={css.header}>
        {getString('connectors.ceK8.chooseRequirements.heading')}
      </Heading>
      <div style={{ padding: 5, paddingBottom: 20 }}>
        {!prevStepData?.spec?.fixFeatureSelection && (
          <Text> {getString('connectors.ceK8.chooseRequirements.subheading')}</Text>
        )}
        {getString(
          prevStepData?.spec?.fixFeatureSelection
            ? 'connectors.ceK8.chooseRequirements.fixFeaturesDescription'
            : 'connectors.ceK8.chooseRequirements.description'
        )}
      </div>
      <div style={{ flex: 1 }}>
        <CardSelect
          data={cardData}
          selected={cardsSelected}
          multi={true}
          className={css.grid}
          onChange={item => {
            handleCardSelection(item)
          }}
          cornerSelected={true}
          renderItem={item => (
            <div>
              <div style={{ display: 'flex', paddingBottom: 7 }}>
                <Icon name={item.icon} size={32} color="primary5" style={{ paddingRight: 10 }}></Icon>
                <p>
                  <div style={{ fontSize: 8, fontFamily: 'inter' }}>{item.heading}</div>{' '}
                  <div style={{ fontSize: 14, fontFamily: 'inter' }}>{item.subheading}</div>
                </p>
              </div>
              <p>
                <div dangerouslySetInnerHTML={{ __html: item.text }} />
              </p>
            </div>
          )}
        ></CardSelect>

        <Layout.Horizontal className={css.buttonPanel} spacing="small">
          <Button text={getString('previous')} icon="chevron-left" onClick={handleprev}></Button>
          <Button
            type="submit"
            intent="primary"
            text={getString('continue')}
            rightIcon="chevron-right"
            onClick={handleSubmit}
          />
        </Layout.Horizontal>
      </div>
    </Layout.Vertical>
  )
}

export default FeatureSelectionStep
