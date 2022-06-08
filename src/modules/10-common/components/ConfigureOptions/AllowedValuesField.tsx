/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation, FormInput, Layout, MultiSelectOption, SelectOption } from '@harness/uicore'
import { Position } from '@blueprintjs/core'
import { useStrings, String } from 'framework/strings'

import type { FormValues } from './ConfigureOptionsUtils'

import css from './ConfigureOptions.module.scss'

export interface AllowedValuesFieldsProps {
  values: FormValues
  showAdvanced: boolean
  setFieldValue: (field: string, value: any) => void
  isReadonly: boolean
  fetchValues?: (done: (response: SelectOption[] | MultiSelectOption[]) => void) => void
  options: SelectOption[] | MultiSelectOption[]
}

export default function AllowedValuesFields(props: AllowedValuesFieldsProps): React.ReactElement {
  const { values, showAdvanced, setFieldValue, isReadonly, fetchValues, options } = props
  const { getString } = useStrings()
  return (
    <div className={css.allowedOptions}>
      {showAdvanced ? (
        <span className={css.advancedBtn}>
          <Button
            variation={ButtonVariation.LINK}
            tooltip={
              values.isAdvanced ? undefined : (
                <Layout.Horizontal padding="medium">
                  <String stringID="common.configureOptions.advancedHelp" useRichText={true} />
                </Layout.Horizontal>
              )
            }
            tooltipProps={{ position: Position.RIGHT }}
            text={values.isAdvanced ? getString('common.configureOptions.returnToBasic') : getString('advancedTitle')}
            onClick={() => {
              setFieldValue('isAdvanced', !values.isAdvanced)
            }}
            disabled={isReadonly}
          />
        </span>
      ) : /* istanbul ignore next */ null}
      {values.isAdvanced ? (
        <FormInput.TextArea
          name="advancedValue"
          label={getString('common.configureOptions.jexlLabel')}
          placeholder={getString('inputTypes.EXPRESSION')}
          disabled={isReadonly}
        />
      ) : (
        <>
          {!fetchValues ? (
            <FormInput.KVTagInput
              label={getString('allowedValues')}
              name="allowedValues"
              isArray={true}
              disabled={isReadonly}
            />
          ) : (
            <FormInput.MultiSelect
              items={options}
              label={getString('common.configureOptions.values')}
              name="allowedValues"
              disabled={isReadonly}
            />
          )}
        </>
      )}
    </div>
  )
}
