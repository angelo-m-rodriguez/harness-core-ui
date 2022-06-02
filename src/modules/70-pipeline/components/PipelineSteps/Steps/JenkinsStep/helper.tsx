import type { SelectOption } from '@harness/uicore'
import type { BuildStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import type { FormikProps } from 'formik'
import type { JenkinsStepData } from './types'

export const resetForm = (formik: FormikProps<JenkinsStepData>, parent: string) => {
  if (parent === 'connectorRef') {
    formik.setFieldValue('spec.jobName', '')
    formik.setFieldValue('spec.jobParamters', '')
  }
  if (parent === 'jobName') {
    formik.setFieldValue('spec.jobParameters', '')
  }
}

export const scriptInputType: SelectOption[] = [
  { label: 'String', value: 'String' },
  { label: 'Number', value: 'Number' }
]
