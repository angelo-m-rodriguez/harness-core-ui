/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, MultiTypeInputType } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { debounce, isEmpty, isEqual, set } from 'lodash-es'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import {
  StepCommandsWithRef as StepCommands,
  StepFormikRef
} from '@pipeline/components/PipelineStudio/StepCommands/StepCommands'
import type { StepElementConfig } from 'services/cd-ng'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { Values } from '@pipeline/components/PipelineStudio/StepCommands/StepCommandTypes'
import type { TemplateFormRef } from '@templates-library/components/TemplateStudio/TemplateStudio'
import { getStepDataFromValues } from '@pipeline/utils/stepUtils'
import { TemplateContext } from '../../TemplateContext/TemplateContext'
import css from './StepTemplateForm.module.scss'

const StepTemplateForm = (_props: unknown, formikRef: TemplateFormRef): JSX.Element => {
  const {
    state: { template },
    updateTemplate,
    isReadonly
  } = React.useContext(TemplateContext)
  const stepFormikRef = React.useRef<StepFormikRef | null>(null)

  React.useImperativeHandle(formikRef, () => ({
    resetForm() {
      return stepFormikRef.current?.resetForm()
    },
    submitForm() {
      return stepFormikRef.current?.submitForm() || Promise.resolve()
    },
    getErrors() {
      return stepFormikRef.current?.getErrors() || {}
    }
  }))

  const onSubmitStep = async (item: Partial<Values>): Promise<void> => {
    const processNode = getStepDataFromValues(item, template.spec as StepElementConfig)
    if (!isEqual(template.spec, processNode)) {
      set(template, 'spec', processNode)
      await updateTemplate(template)
    }
  }

  const debounceSubmit = debounce((step: Partial<Values>): void => {
    onSubmitStep(step)
  }, 500)
  // temp changes
  const template1 = { ...template, spec: { type: 'ShellScript' } }
  return (
    <Container background={Color.FORM_BG}>
      {template1 && !isEmpty(template1.spec) && !!(template1.spec as StepElementConfig)?.type && (
        <StepCommands
          className={css.stepForm}
          step={template1.spec as StepElementConfig}
          isReadonly={isReadonly}
          stepsFactory={factory}
          onChange={debounceSubmit}
          onUpdate={debounceSubmit}
          isStepGroup={false}
          stepViewType={StepViewType.Template}
          ref={stepFormikRef}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
        />
      )}
    </Container>
  )
}

export const StepTemplateFormWithRef = React.forwardRef(StepTemplateForm)
