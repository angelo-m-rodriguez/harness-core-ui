import type { SelectOption } from '@harness/uicore'
import type { FormikProps } from 'formik'
import type { JenkinsStepData } from './types'

export const resetForm = (formik: FormikProps<JenkinsStepData>, parent: string) => {
  if (parent === 'connectorRef') {
    formik.setFieldValue('spec.jobName', '')
    formik.setFieldValue('spec.jobParamter', [])
  }
  if (parent === 'jobName') {
    formik.setFieldValue('spec.jobParameter', [])
  }
}

export const scriptInputType: SelectOption[] = [
  { label: 'String', value: 'String' },
  { label: 'Number', value: 'Number' }
]
