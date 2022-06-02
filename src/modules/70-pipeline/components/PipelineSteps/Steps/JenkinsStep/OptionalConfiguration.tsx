import React from 'react'
import type { MultiTypeInputType } from '@wings-software/uicore'
import { FormMultiTypeCheckboxField } from '@common/components'
import cx from 'classnames'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useStrings } from 'framework/strings'

const OptionalConfiguration = (props: { readonly?: boolean; allowableTypes: MultiTypeInputType[] }) => {
  const { readonly, allowableTypes } = props
  const { expressions } = useVariablesExpression()
  const { getString } = useStrings()
  return (
    <>
      <div className={cx(stepCss.formGroup, stepCss.md)}>
        <FormMultiTypeCheckboxField
          name="spec.unstableStatusAsSuccess"
          label={getString('pipeline.jenkinsStep.unstableStatusAsSuccess')}
          multiTypeTextbox={{ expressions, disabled: readonly, allowableTypes }}
          disabled={readonly}
        />
      </div>
      <div className={cx(stepCss.formGroup, stepCss.md)}>
        <FormMultiTypeCheckboxField
          name="spec.captureEnvironmentVariable"
          label={getString('pipeline.jenkinsStep.captureEnvironmentVariable')}
          multiTypeTextbox={{ expressions, disabled: readonly, allowableTypes }}
          disabled={readonly}
        />
      </div>
    </>
  )
}

export default OptionalConfiguration
