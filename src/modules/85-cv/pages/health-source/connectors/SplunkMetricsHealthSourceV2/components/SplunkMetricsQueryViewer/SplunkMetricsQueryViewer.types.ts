import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'

export interface MapQueriesToHarnessServiceLayoutProps {
  formikProps: any
  connectorIdentifier: any
  onChange: (name: string, value: string | SelectOption | boolean) => void
}
