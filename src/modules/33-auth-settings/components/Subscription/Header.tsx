/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FontVariation, Layout, Text, MultiStepProgressIndicator } from '@harness/uicore'
import type { IconName } from '@blueprintjs/core'
import type { Module } from 'framework/types/ModuleName'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'

type StepStatus = 'TODO' | 'INPROGRESS' | 'FAILED' | 'SUCCESS'

function getTiltleByModule(module: Module): { icon?: string; description?: string } {
  let icon, description
  switch (module) {
    case 'cf': {
      icon = 'ff-solid'
      description = 'common.purpose.cf.continuous'
      break
    }
    case 'cd': {
      icon = 'cd-solid'
      description = 'common.purpose.cd.continuous'
      break
    }
    case 'ci': {
      icon = 'ci-solid'
      description = 'common.purpose.ci.continuous'
      break
    }
    case 'ce': {
      icon = 'ccm-solid'
      description = 'common.purpose.ce.continuous'
      break
    }
    case 'cv': {
      icon = 'cv-solid'
      description = 'common.purpose.cv.continuous'
      break
    }
    case 'sto': {
      icon = 'sto-color-filled'
      description = 'common.purpose.sto.continuous'
      break
    }
  }

  return { icon, description }
}

function getProgressMap(step: number): Map<number, StepStatus> {
  const progressMap = new Map<number, StepStatus>([
    [1, 'TODO'],
    [2, 'TODO'],
    [3, 'TODO']
  ])

  while (step > 0) {
    progressMap.set(step, 'SUCCESS')
    step--
  }

  return progressMap
}

export const Header = ({
  module,
  stepDescription,
  step
}: {
  module: Module
  stepDescription: string
  step: number
}): React.ReactElement => {
  const { icon, description } = getTiltleByModule(module)
  const { getString } = useStrings()

  if (!icon || !description) {
    return <></>
  }

  const title = `${getString(description as keyof StringsMap)} ${getString('common.plans.subscription')}`

  return (
    <Layout.Vertical padding={{ bottom: 'large' }}>
      <Text
        icon={icon as IconName}
        iconProps={{ size: 24, padding: { right: 'small' } }}
        font={{ variation: FontVariation.H4 }}
        padding={{ bottom: 'large' }}
      >
        {title}
      </Text>
      <MultiStepProgressIndicator progressMap={getProgressMap(step)} />
      <Text padding={{ top: 'large' }} font={{ variation: FontVariation.H3 }}>
        {stepDescription}
      </Text>
    </Layout.Vertical>
  )
}
