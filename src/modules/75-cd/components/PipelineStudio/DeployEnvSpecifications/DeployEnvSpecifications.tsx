/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { MutableRefObject, PropsWithChildren, useCallback, useContext, useEffect, useRef } from 'react'
import { debounce, get, isEmpty, set } from 'lodash-es'
import produce from 'immer'
import cx from 'classnames'

import { Card, Container, RUNTIME_INPUT_VALUE } from '@harness/uicore'

import { useStrings } from 'framework/strings'
import type { StageElementConfig } from 'services/cd-ng'

import { Scope } from '@common/interfaces/SecretsInterface'

import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { StageType } from '@pipeline/utils/stageHelpers'

import DeployServiceErrors from '@cd/components/PipelineStudio/DeployServiceSpecifications/DeployServiceErrors'

import stageCss from '../DeployStageSetupShell/DeployStage.module.scss'

export default function DeployEnvSpecifications(props: PropsWithChildren<unknown>): JSX.Element {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const { getString } = useStrings()
  const { submitFormsForTab } = useContext(StageErrorContext)
  const { errorMap } = useValidationErrors()
  useEffect(() => {
    if (errorMap.size > 0) {
      submitFormsForTab(DeployTabs.ENVIRONMENT)
    }
  }, [errorMap])

  const {
    state: {
      selectionState: { selectedStageId }
    },
    isReadonly,
    scope,
    allowableTypes,
    getStageFromPipeline,
    updateStage
  } = usePipelineContext()

  const debounceUpdateStage = useCallback(
    debounce(
      (changedStage?: StageElementConfig) =>
        changedStage ? updateStage(changedStage) : /* instanbul ignore next */ Promise.resolve(),
      300
    ),
    [updateStage]
  )

  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')

  useEffect(() => {
    if (isEmpty((stage?.stage?.spec as any)?.environment) && stage?.stage?.type === StageType.DEPLOY) {
      const stageData = produce(stage, draft => {
        if (draft) {
          set(draft, 'stage.spec', {
            ...stage.stage?.spec,
            environment: {}
          })
        }
      })
      debounceUpdateStage(stageData?.stage)
    }
  }, [])

  const updateEnvStep = useCallback(
    (value: any) => {
      const stageData = produce(stage, draft => {
        const environmentObj: any = get(draft, 'stage.spec.environment', {})
        if (value.environmentRef) {
          environmentObj.environmentRef = value.environmentRef
          environmentObj.infrastructureDefinitions = [{ ref: value.infrastructureRef }]
        }
      })
      debounceUpdateStage(stageData?.stage)
    },
    [stage, debounceUpdateStage, stage?.stage?.spec?.infrastructure?.infrastructureDefinition]
  )

  return (
    <div className={stageCss.deployStage} key="1">
      <DeployServiceErrors domRef={scrollRef as MutableRefObject<HTMLElement | undefined>} />
      <div className={cx(stageCss.contentSection, stageCss.paddedSection)} ref={scrollRef}>
        <div className={stageCss.tabHeading} id="environment">
          {getString('environment')}
        </div>
        <Card>
          <StepWidget
            type={StepType.DeployInfrastructure}
            readonly={isReadonly || scope !== Scope.PROJECT}
            initialValues={{
              environmentRef:
                scope === Scope.PROJECT ? get(stage, 'stage.spec.environment.environmentRef', '') : RUNTIME_INPUT_VALUE,
              infrastructureRef:
                scope === Scope.PROJECT
                  ? get(stage, 'stage.spec.environment.infrastructureDefinitions', [])?.[0]
                  : RUNTIME_INPUT_VALUE
            }}
            allowableTypes={allowableTypes}
            onUpdate={val => updateEnvStep(val)}
            factory={factory}
            stepViewType={StepViewType.Edit}
          />
        </Card>
        {/* <SelectWithSubmenu
          addClearBtn
          onChange={itemSelect}
          label={'Select the environment or group that you want to deploy to'}
          value={selectedItem}
          items={[
            {
              label: getString('environment'),
              value: getString('environment'),
              submenuItems: envData?.data?.content?.map(item => ({
                label: item.environment?.name,
                value: `${getString('environment')}|${item.environment?.identifier}`
              })) as SelectOption[]
            },
            {
              label: getString('common.environmentGroup.label'),
              value: getString('common.environmentGroup.label'),
              submenuItems: envGroupData?.data?.content?.map(item => ({
                label: item.envGroup?.name,
                value: `${getString('common.environmentGroup.label')}|${item.envGroup?.identifier}`,
                environments: item.envGroup?.envResponse
              })) as SelectOption[]
            }
          ]}
          itemSelect={itemSelect}
          loading={envLoading || envGroupLoading}
        /> */}
        <Container margin={{ top: 'xxlarge' }}>{props.children}</Container>
      </div>
    </div>
  )
}
