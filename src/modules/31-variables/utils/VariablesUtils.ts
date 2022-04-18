import type { SelectOption } from '@wings-software/uicore'
import type { StringKeys } from 'framework/strings'
import type { StringVariableDTO, VariableDTO, VariableRequestDTO } from 'services/cd-ng'

export enum VariableType {
  String = 'String'
}

export interface VariableFormData {
  name: string
  identifier: string
  description: string
  type: VariableDTO['type']
  fixedValue: string
  allowedValue: string[]
  defaultValue: string
}

export interface VariableFormDataWithScope extends VariableFormData {
  projectIdentifier?: string
  orgIdentifier?: string
}

export const labelStringMap: Record<VariableType, StringKeys> = {
  [VariableType.String]: 'string'
}

export const getVaribaleTypeOptions = (getString: (key: StringKeys) => string): SelectOption[] => {
  return [
    {
      label: getString('string'),
      value: VariableType.String
    }
  ]
}

export function convertVariableFormDataToDTO(data: VariableFormDataWithScope): VariableRequestDTO {
  return {
    variable: {
      name: data.name,
      identifier: data.identifier,
      description: data.description,
      type: data.type,
      spec: {
        variableValueType: 'FIXED',
        fixedValue: data.fixedValue
      } as StringVariableDTO
    }
  }
}
