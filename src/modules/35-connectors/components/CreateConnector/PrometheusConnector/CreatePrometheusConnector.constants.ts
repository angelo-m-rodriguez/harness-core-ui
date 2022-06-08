import { ValueType } from '@secrets/components/TextReference/TextReference'
import type { PlainEntity } from '../CustomHealthConnector/components/CustomHealthHeadersAndParams/CustomHealthHeadersAndParams.types'

export const DefaultHeadersInitialValues: Array<PlainEntity> = [
  {
    key: '',
    value: {
      textField: '',
      fieldType: ValueType.TEXT
    }
  }
]

export const HeadersKey = 'headers'
