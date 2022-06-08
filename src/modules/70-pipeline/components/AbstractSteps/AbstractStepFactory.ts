/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'
import { isEmpty } from 'lodash-es'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import type { StringsMap } from 'stringTypes'
import type { Step } from './Step'

export interface StepData {
  name: string
  icon: IconName
  type: string
  visible?: boolean
}

export abstract class AbstractStepFactory {
  /**
   * Couples the factory with the steps it generates
   */
  protected abstract type: string

  protected stepBank: Map<string, Step<unknown>>
  protected stepIconMap: Map<string, StepData>
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    this.stepBank = new Map()
    this.stepIconMap = new Map()
  }

  getType(): string {
    return this.type
  }

  registerStep<T>(step: Step<T>): void {
    this.stepBank.set(step.getType(), step as Step<unknown>)
    this.stepIconMap.set(step.getType(), {
      name: step.getStepName(),
      icon: step.getIconName(),
      type: step.getType(),
      visible: step.getStepPaletteVisibility()
    })
    const stepMap = step.getInvocationMap()
    if (stepMap) {
      this.invocationMap = new Map([...this.invocationMap, ...stepMap])
    }
  }

  deregisterStep(type: string): void {
    const deletedStep = this.stepBank.get(type)
    if (deletedStep) {
      this.stepBank.delete(type)
      this.stepIconMap.delete(type)
      if (deletedStep.getInvocationMap()) {
        this.invocationMap = new Map()
        this.stepBank.forEach(step => {
          const stepMap = step.getInvocationMap()
          if (stepMap) {
            this.invocationMap = new Map([...this.invocationMap, ...stepMap])
          }
        })
      }
    }
  }

  getStep<T>(type?: string): Step<T> | undefined {
    if (type && !isEmpty(type)) {
      return this.stepBank.get(type) as Step<T>
    }
    return
  }

  getStepDescription(type: string): keyof StringsMap | undefined {
    return this.stepBank.get(type)?.getDescription()
  }

  getStepName(type: string): string | undefined {
    return this.stepBank.get(type)?.getStepName()
  }

  getStepIcon(type: string): IconName {
    return this.stepBank.get(type)?.getIconName() || 'disable'
  }

  getStepIconColor(type: string): string | undefined {
    return this.stepBank.get(type)?.getIconColor() || undefined
  }

  getStepIconSize(type: string): number | undefined {
    return this.stepBank.get(type)?.getIconSize() || undefined
  }

  getStepIsHarnessSpecific(type: string): boolean {
    return this.stepBank.get(type)?.getIsHarnessSpecific() || false
  }

  getStepData(type: string): StepData | undefined {
    return this.stepIconMap.get(type)
  }

  getInvocationMap(): Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > {
    return this.invocationMap
  }

  getAllStepsDataList(): Array<StepData> {
    return Array.from(this.stepIconMap, ([_key, value]) => value).filter(step => step.visible)
  }
}
