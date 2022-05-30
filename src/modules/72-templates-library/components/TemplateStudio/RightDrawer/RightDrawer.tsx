/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { SyntheticEvent, useMemo } from 'react'
import { Drawer, Position } from '@blueprintjs/core'
import { Button, Container, Icon, Layout, Text } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { StageType } from '@pipeline/utils/stageHelpers'
import { useStrings } from 'framework/strings'
import type { StepData } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import { StepPalette } from '@pipeline/components/PipelineStudio/StepPalette/StepPalette'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { DrawerSizes, DrawerTypes } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import type { StepElementConfig } from 'services/cd-ng'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import type { NGTemplateInfoConfigWithGitDetails } from 'framework/Templates/TemplateConfigModal/TemplateConfigModal'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { getAllStepPaletteModuleInfos, getStepPaletteModuleInfosFromStage } from '@pipeline/utils/stepUtils'
import type { StepPalleteModuleInfo } from 'services/pipeline-ng'
import TemplateVariablesWrapper from '@templates-library/components/TemplateStudio/TemplateVariables/TemplateVariables'
import { TemplateInputs } from '@templates-library/components/TemplateInputs/TemplateInputs'
import css from './RightDrawer.module.scss'

function TemplateInputsWrapper({ templateDetails }: { templateDetails: NGTemplateInfoConfigWithGitDetails }) {
  const { getString } = useStrings()

  const TemplateInputsHeader = (
    <Layout.Horizontal padding="xlarge" border={{ bottom: true, color: Color.GREY_200 }}>
      <Icon name="template-inputs" size={24} color={Color.PRIMARY_7} margin={{ right: 'small' }} />
      <Text font={{ variation: FontVariation.H4 }}>{getString('pipeline.templateInputs')}</Text>
    </Layout.Horizontal>
  )
  return (
    <Layout.Vertical>
      {TemplateInputsHeader}
      <Container className={css.templateInputsContainer}>
        <TemplateInputs template={templateDetails} />
      </Container>
    </Layout.Vertical>
  )
}

export const RightDrawer: React.FC = (): JSX.Element => {
  const {
    state: {
      templateView: { drawerData, isDrawerOpened },
      templateView,
      template,
      gitDetails
    },
    updateTemplateView
  } = React.useContext(TemplateContext)
  const { type, data, ...restDrawerProps } = drawerData
  const { module } = useParams<ModulePathParams>()
  const { CDNG_ENABLED, CING_ENABLED, CFNG_ENABLED } = useFeatureFlags()
  const [stepPaletteModuleInfos, setStepPaletteModuleInfos] = React.useState<StepPalleteModuleInfo[]>([])

  const selectedTemplateDetails = useMemo(
    () => ({
      ...template,
      repo: gitDetails?.repoIdentifier,
      branch: gitDetails?.branch
    }),
    [template]
  ) as NGTemplateInfoConfigWithGitDetails

  const closeDrawer = (e?: SyntheticEvent<HTMLElement, Event> | undefined): void => {
    e?.persist()
    updateTemplateView({ ...templateView, isDrawerOpened: false, drawerData: { type: DrawerTypes.AddStep } })
  }

  const onStepSelection = async (item: StepData): Promise<void> => {
    const stepData: StepElementConfig = {
      identifier: '',
      name: '',
      type: item.type
    }
    data?.paletteData?.onSelection?.(stepData)
  }

  React.useEffect(() => {
    if (module === 'cd') {
      setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.DEPLOY))
    } else if (module === 'ci') {
      setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.BUILD))
    } else if (module === 'cf') {
      setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.FEATURE))
    } else {
      if (CDNG_ENABLED && CING_ENABLED && CFNG_ENABLED) {
        setStepPaletteModuleInfos(getAllStepPaletteModuleInfos())
      } else if (CDNG_ENABLED) {
        setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.DEPLOY))
      } else if (CING_ENABLED) {
        setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.BUILD))
      } else if (CFNG_ENABLED) {
        setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.FEATURE))
      }
    }
  }, [module])

  return (
    <Drawer
      onClose={closeDrawer}
      usePortal={true}
      autoFocus={true}
      canEscapeKeyClose={true}
      canOutsideClickClose={true}
      enforceFocus={false}
      hasBackdrop={true}
      size={DrawerSizes[type]}
      isOpen={isDrawerOpened}
      position={Position.RIGHT}
      data-type={type}
      className={cx(css.main, css.almostFullScreen, css.fullScreen)}
      portalClassName={'pipeline-studio-right-drawer'}
      {...restDrawerProps}
    >
      <Button
        minimal
        className={css.almostFullScreenCloseBtn}
        icon="cross"
        withoutBoxShadow
        onClick={() => {
          updateTemplateView({ ...templateView, isDrawerOpened: false, drawerData: { type: DrawerTypes.AddStep } })
        }}
      />

      {type === DrawerTypes.AddStep && (
        <StepPalette
          stepsFactory={factory}
          stepPaletteModuleInfos={stepPaletteModuleInfos}
          stageType={StageType.BUILD}
          onSelect={onStepSelection}
        />
      )}
      {type === DrawerTypes.TemplateVariables && <TemplateVariablesWrapper />}
      {type === DrawerTypes.TemplateInputs && <TemplateInputsWrapper templateDetails={selectedTemplateDetails} />}
    </Drawer>
  )
}
