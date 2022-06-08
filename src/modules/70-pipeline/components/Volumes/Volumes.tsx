/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  FormInput,
  Text,
  Button,
  Container,
  MultiTypeInputType,
  Layout,
  getMultiTypeFromValue
} from '@wings-software/uicore'
import { get } from 'lodash-es'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { FieldArray, FormikProps } from 'formik'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { FormMultiTypeCheckboxField } from '@common/components'
import { useStrings, UseStringsReturn } from 'framework/strings'
import css from './Volumes.module.scss'

export interface AddConditionInterface {
  key: string
  operator: string
  value: string
}

interface VolumesPropsInterface {
  formik: FormikProps<unknown>
  name: string
  expressions?: string[]
  disabled?: boolean
  allowableTypes?: MultiTypeInputType[]
}

const emptyRow = { mountPath: '', type: '' }

enum FieldType {
  TextInput = 'TextInput',
  Checkbox = 'Checkbox'
}
export enum VolumesTypes {
  EmptyDir = 'EmptyDir',
  HostPath = 'HostPath',
  PersistentVolumeClaim = 'PersistentVolumeClaim'
}

const getTypeOptions = (getString: UseStringsReturn['getString']): { label: string; value: VolumesTypes }[] => [
  { label: getString('pipeline.buildInfra.emptyDirectory'), value: VolumesTypes.EmptyDir },
  { label: getString('pipeline.buildInfra.hostPath'), value: VolumesTypes.HostPath },
  { label: getString('pipeline.buildInfra.persistentVolumeClaim'), value: VolumesTypes.PersistentVolumeClaim }
]

const getDefaultSpec = (type: VolumesTypes): { [key: string]: unknown } => {
  if (type === VolumesTypes.EmptyDir) {
    return { medium: '' }
  } else if (type === VolumesTypes.HostPath) {
    return { path: '' }
  } else if (type === VolumesTypes.PersistentVolumeClaim) {
    return { claimName: '', readOnly: false }
  }
  return {}
}

const getAdditionalTextFields = (
  type: VolumesTypes,
  getString: UseStringsReturn['getString']
): { label: string; name: string; tooltipId: string; optional: boolean; fieldType: FieldType }[] | undefined => {
  if (type === VolumesTypes.EmptyDir) {
    return [
      {
        label: getString('connectors.cdng.verificationSensitivityLabel.medium'),
        name: 'spec.medium',
        fieldType: FieldType.TextInput,
        tooltipId: 'medium',
        optional: true
      },
      {
        label: getString('pipeline.buildInfra.size'),
        name: 'spec.size',
        fieldType: FieldType.TextInput,
        tooltipId: 'size',
        optional: true
      }
    ]
  } else if (type === VolumesTypes.HostPath) {
    return [
      {
        label: getString('common.path'),
        name: 'spec.path',
        fieldType: FieldType.TextInput,
        tooltipId: 'path',
        optional: false
      },
      {
        label: getString('pipeline.buildInfra.pathType'),
        name: 'spec.type',
        fieldType: FieldType.TextInput,
        tooltipId: 'pathType',
        optional: true
      }
    ]
  } else if (type === VolumesTypes.PersistentVolumeClaim) {
    return [
      {
        label: getString('pipeline.buildInfra.claimName'),
        name: 'spec.claimName',
        fieldType: FieldType.TextInput,

        tooltipId: 'claimName',
        optional: false
      },
      {
        label: getString('common.readOnly'),
        name: 'spec.readOnly',
        fieldType: FieldType.Checkbox,
        tooltipId: 'readOnly',
        optional: false
      }
    ]
  }
}

export const getOptionalSubLabel = (getString: UseStringsReturn['getString'], tooltip?: string): JSX.Element => (
  <Text
    className={css.capitalize}
    tooltipProps={{ dataTooltipId: tooltip }}
    color={Color.GREY_400}
    font={{ size: 'small', weight: 'semi-bold' }}
  >
    {getString('common.optionalLabel')}
  </Text>
)

const renderFields = ({
  formik,
  name,
  getString,
  type,
  index,
  expressions,
  disabled
}: {
  formik: FormikProps<any>
  name: string
  type: VolumesTypes
  getString: UseStringsReturn['getString']
  index: number
  expressions?: string[]
  allowableTypes?: MultiTypeInputType[]
  disabled?: boolean
}): JSX.Element | null => {
  const additionalFields = getAdditionalTextFields(type, getString) || []
  const allowableTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
  return (
    <>
      {additionalFields.map((field, i) => {
        if (field.fieldType === FieldType.TextInput) {
          return (
            <FormInput.MultiTextInput
              key={`${field.name}-${i}`}
              name={`${name}.${[index]}.${field.name}`}
              disabled={disabled}
              className={css.textContainer}
              multiTextInputProps={{ expressions, allowableTypes, disabled }}
              label={
                <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                  <Text
                    className={css.field}
                    color={Color.GREY_800}
                    font={{ size: 'small', weight: 'semi-bold' }}
                    {...(!field.optional && { tooltipProps: { dataTooltipId: field.tooltipId } })}
                  >
                    {field.label}
                  </Text>
                  &nbsp;
                  {field.optional && getOptionalSubLabel(getString, field.tooltipId)}
                </Layout.Horizontal>
              }
            />
          )
        } else if (field.fieldType === FieldType.Checkbox) {
          const readOnlyValue = get(formik.values, `${name}.${[index]}.${field.name}`)
          return (
            <FormMultiTypeCheckboxField
              name={`${name}.${[index]}.${field.name}`}
              className={cx(css.checkbox, typeof readOnlyValue === 'boolean')}
              label={field.label}
              multiTypeTextbox={{
                expressions,
                allowableTypes,
                disabled
              }}
              tooltipProps={{ dataTooltipId: field.tooltipId }}
              disabled={disabled}
            />
          )
        }
        return null
      })}
    </>
  )
}

function VolumeRow({
  formik,
  name,
  getString,
  index,
  expressions,
  allowableTypes,
  disabled
}: {
  formik: FormikProps<any>
  name: string
  index: number
  getString: UseStringsReturn['getString']
  expressions?: string[]
  allowableTypes?: MultiTypeInputType[]
  disabled?: boolean
}): JSX.Element {
  const { values = {} } = formik
  const type = get(values, name)?.[index]?.type
  return (
    <>
      <FormInput.MultiTextInput
        name={`${name}.${[index]}.mountPath`}
        className={css.textContainer}
        disabled={disabled}
        multiTextInputProps={{ expressions, allowableTypes, disabled }}
        label={
          <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
            <Text
              style={{ display: 'flex', alignItems: 'center' }}
              color={Color.GREY_800}
              font={{ size: 'small', weight: 'semi-bold' }}
              tooltipProps={{ dataTooltipId: 'mountPath' }}
            >
              {getString('pipeline.buildInfra.mountPath')}
            </Text>
          </Layout.Horizontal>
        }
      />
      <FormInput.Select
        items={getTypeOptions(getString)}
        name={`${name}.${[index]}.type`}
        disabled={disabled}
        label="Type"
        onChange={option => {
          if (option?.value) {
            const newSpec = getDefaultSpec(option.value as VolumesTypes)
            formik.setFieldValue(`${name}.${[index]}.spec`, newSpec)
          }
        }}
      />
      {type && renderFields({ formik, name, getString, index, type, expressions, disabled })}
    </>
  )
}

export default function Volumes({
  formik,
  name,
  expressions,
  disabled,
  allowableTypes
}: VolumesPropsInterface): JSX.Element {
  const { setFieldValue, values = {} } = formik
  const { getString } = useStrings()
  const value = get(values, name) || []

  return (
    <>
      {typeof value === 'string' && getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME ? (
        <FormInput.MultiTextInput
          style={{ width: '300px', marginBottom: 0 }}
          name={name}
          disabled={disabled}
          label={
            <Text
              font={{ variation: FontVariation.FORM_LABEL }}
              margin={{ bottom: 'xsmall' }}
              tooltipProps={{ dataTooltipId: 'volumes' }}
            >
              {getString('pipeline.buildInfra.volumes')}
            </Text>
          }
          multiTextInputProps={{
            allowableTypes
          }}
        />
      ) : (
        <MultiTypeFieldSelector
          name="volumes"
          label={
            <Text
              font={{ variation: FontVariation.FORM_LABEL }}
              margin={{ bottom: 'xsmall' }}
              tooltipProps={{ dataTooltipId: 'volumes' }}
            >
              {getString('pipeline.buildInfra.volumes')}
            </Text>
          }
          disabled={disabled}
          allowedTypes={allowableTypes}
          style={{ flexGrow: 1, marginBottom: 0 }}
        >
          <section data-name="volumes">
            <FieldArray
              name="volumes"
              render={() => (
                <>
                  {value?.map((_addCondition: AddConditionInterface, index: number) => (
                    <Container key={index} data-name="rowContainer" className={cx(css.rowContainer, css.group)}>
                      <VolumeRow
                        index={index}
                        name={name}
                        formik={formik}
                        getString={getString}
                        allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
                        expressions={expressions}
                        disabled={disabled}
                      />
                      <div className={cx(css.withoutAligning)}>
                        <Button
                          icon="main-trash"
                          iconProps={{ size: 20 }}
                          minimal
                          disabled={disabled}
                          className={css.rowTrashIcon}
                          data-name="main-delete"
                          data-testid={`remove-${name}-[${index}]`}
                          color={Color.GREY_500}
                          onClick={() => {
                            const newValue = [...value]
                            newValue.splice(index, 1)
                            setFieldValue(name, newValue)
                          }}
                        />
                      </div>
                    </Container>
                  ))}
                </>
              )}
            />
            <Button
              intent="primary"
              minimal
              className={css.paddingZero}
              text={getString('plusAdd')}
              data-testid={`add-${name}`}
              onClick={() => {
                if (!value) {
                  setFieldValue(name, [emptyRow])
                } else {
                  setFieldValue(name, [...value, emptyRow])
                }
              }}
              disabled={disabled}
            />
          </section>
        </MultiTypeFieldSelector>
      )}
    </>
  )
}
