/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as yup from 'yup'
import type { StringSchema, Lazy, ArraySchema, Schema } from 'yup'
import type { FormikErrors } from 'formik'
import { getMultiTypeFromValue, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { get, set, uniq, uniqBy, isEmpty, isUndefined } from 'lodash-es'
import type { UseStringsReturn, StringKeys } from 'framework/strings'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type { ExecutionWrapperConfig, StepElementConfig } from 'services/cd-ng'
import type { K8sDirectInfraYaml } from 'services/ci'
import {
  illegalIdentifiers,
  keyRegexIdentifier,
  portNumberRegex,
  regexIdentifier,
  serviceDependencyIdRegex
} from '@common/utils/StringUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import {
  IdentifierSchema,
  IdentifierSchemaWithoutHook,
  NameSchema,
  NameSchemaWithoutHook
} from '@common/utils/Validation'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'

export enum Types {
  Text,
  List,
  Map,
  Identifier,
  Name,
  OutputVariables,
  LimitMemory,
  LimitCPU,
  Timeout,
  Boolean,
  ImagePullPolicy,
  Shell,
  Numeric,
  KeyValue,
  BuildEnvironment,
  FrameworkVersion,
  BuildTool
}

interface Field {
  name: string
  type: Types | Types[]
  label?: string
  isRequired?: boolean
  isInputSet?: boolean
  isActive?: boolean
}

interface SchemaField {
  name: string
  validationRule: Schema<any>
  isActive?: boolean
}

type Dependencies = { [key: string]: any }

interface GenerateSchemaDependencies extends Dependencies {
  getString: UseStringsReturn['getString']
}

function generateSchemaForIdentifier({
  initialValues,
  steps,
  serviceDependencies,
  getString
}: GenerateSchemaDependencies): StringSchema {
  return (IdentifierSchemaWithoutHook(getString) as StringSchema).test(
    'isStepIdUnique',
    getString('validation.uniqueStepAndServiceDependenciesId'),
    identifier => {
      if (isEmpty(initialValues) || (isEmpty(steps) && isEmpty(serviceDependencies))) return true

      const stepsAndDependencies: StepElementConfig[] = [...serviceDependencies]

      // TODO: Add support for stepGroup
      steps.forEach(({ step, parallel }: ExecutionWrapperConfig) => {
        if (parallel) {
          // TODO: Fix typings
          ;(parallel as any).forEach(({ step: parallelStep }: { step: StepElementConfig }) => {
            stepsAndDependencies.push(parallelStep)
          })
        } else {
          stepsAndDependencies.push(step as StepElementConfig)
        }
      })

      const currentStepIndex = stepsAndDependencies.findIndex(step => {
        return step?.identifier === initialValues.identifier
      })

      return stepsAndDependencies.every((step, index: number) => {
        // Skip ID validation for the currently opened step (if it was already added)
        if (currentStepIndex === index) return true

        return step?.identifier !== identifier
      })
    }
  )
}

function generateSchemaForName({ getString }: GenerateSchemaDependencies): StringSchema {
  return NameSchemaWithoutHook(getString) as StringSchema
}

function generateSchemaForList(
  { label, isRequired, isInputSet }: Field,
  { getString }: GenerateSchemaDependencies
): Lazy {
  if (isInputSet) {
    return yup.lazy(value => {
      if (value === RUNTIME_INPUT_VALUE) {
        return yup.string()
      }
      let schema = yup.array().test('valuesShouldBeUnique', getString('validation.uniqueValues'), list => {
        if (!list) return true
        return uniq(list).length === list.length
      })

      if (isRequired && label) {
        schema = schema
          .ensure()
          .compact()
          .min(1, getString('fieldRequired', { field: getString(label as StringKeys) }))
      }

      return schema
    })
  } else {
    return yup.lazy(value => {
      if (Array.isArray(value)) {
        let schema = yup.array().test('valuesShouldBeUnique', getString('validation.uniqueValues'), list => {
          if (!list) return true
          const listWithoutRuntimeInput = (list as Array<{ id: string; value: string }>).filter(
            item => item?.value !== 'undefined' && item?.value !== RUNTIME_INPUT_VALUE
          )
          return uniqBy(listWithoutRuntimeInput, 'value').length === listWithoutRuntimeInput.length
        })

        if (Array.isArray(value) && isRequired && label) {
          schema = schema
            .ensure()
            .compact((val: any) => !val?.value)
            .min(1, getString('fieldRequired', { field: getString(label as StringKeys) }))
            .test(
              'runtimeInputNotSupported',
              getString('pipeline.runtimeInputNotSupported', { field: getString(label as StringKeys) }),
              list =>
                (list as Array<{ id: string; value: string }>).filter(item => item?.value === RUNTIME_INPUT_VALUE)
                  ?.length === 0
            )
        }

        return schema
      } else {
        return yup.string()
      }
    })
  }
}

// function generateSchemaForSelect(
//   { label, isRequired = false }: Field,
//   { getString }: GenerateSchemaDependencies
// ): StringSchema {
//   return yup.array.test(`${label} is required.`, `${label} is required.`, function (field) {
//     if (!isRequired) {
//       return true
//     }
//     const value = typeof field === 'string' ? field : field?.value

//     return !isUndefined(value)
//   })
//   if (!isRequired) {
//     return true
//   }

//   return NameSchemaWithoutHook(getString) as StringSchema
// }

export function generateSchemaForNumeric(
  { label: labelReference, isRequired }: Field,
  { getString }: GenerateSchemaDependencies
): Lazy {
  return yup.string().test(
    'Must be a number and allows runtimeinput or expression',
    labelReference
      ? getString?.('pipeline.stepCommonFields.validation.mustBeANumber', {
          label: labelReference && getString?.(labelReference as any)
        })
      : getString?.('common.validation.valueMustBeANumber'),
    function (runAsUser) {
      if (!isRequired && isUndefined(runAsUser)) {
        return true
      } else if (runAsUser.startsWith('<+')) {
        return true
      }
      return !isNaN(runAsUser)
    }
  )
}

function generateSchemaForMap(
  { label, isRequired, isInputSet }: Field,
  { getString }: GenerateSchemaDependencies,
  objectShape?: Schema<unknown>
): Lazy {
  if (isInputSet) {
    // We can't add validation for key uniqueness and key's value
    return yup.mixed().test('validKeys', getString('validation.validKeyRegex'), values => {
      if (!values || getMultiTypeFromValue(values as string) === MultiTypeInputType.RUNTIME) {
        return true
      }
      if (typeof values === 'object' && !Array.isArray(values) && values !== null) {
        return Object.keys(values).every(key => keyRegexIdentifier.test(key))
      }
      return true
    })
  } else {
    return yup.lazy(values => {
      if (Array.isArray(values)) {
        let schema = yup
          .array()
          .of(
            objectShape ??
              yup.object().shape(
                {
                  key: yup.string().when('value', {
                    is: val => val?.length,
                    then: yup
                      .string()
                      .matches(keyRegexIdentifier, getString('validation.validKeyRegex'))
                      .required(getString('validation.keyRequired'))
                  }),
                  value: yup.string().when('key', {
                    is: val => val?.length,
                    then: yup.string().required(getString('validation.valueRequired'))
                  })
                },
                [['key', 'value']]
              )
          )
          .test('keysShouldBeUnique', getString('validation.uniqueKeys'), map => {
            if (!map) return true

            return uniqBy(map, 'key').length === map.length
          })

        if (Array.isArray(values) && isRequired && label) {
          schema = schema
            .ensure()
            .compact((val: any) => !val?.value)
            .min(1, getString('fieldRequired', { field: getString(label as StringKeys) }))
        }

        return schema
      } else {
        return yup.string()
      }
    })
  }
}

function generateSchemaForOutputVariables(
  { isInputSet }: Field,
  { getString }: GenerateSchemaDependencies
): ArraySchema<any> | Lazy {
  if (isInputSet) {
    return yup.lazy(value => {
      if (value === RUNTIME_INPUT_VALUE) {
        return yup.string()
      }
      return yup
        .array()
        .of(
          yup.lazy(val => {
            if (
              val &&
              Object.prototype.hasOwnProperty.call(val, 'name') &&
              getMultiTypeFromValue((val as { name: string })['name']) === MultiTypeInputType.FIXED
            ) {
              return yup.object().shape({
                name: yup.string().matches(regexIdentifier, getString('validation.validOutputVariableRegex'))
              })
            } else {
              return yup.string()
            }
          })
        )
        .test('valuesShouldBeUnique', getString('validation.uniqueValues'), outputVariables => {
          if (!outputVariables) return true
          return uniqBy(outputVariables, 'name').length === outputVariables.length
        })
    })
  } else {
    return yup.lazy(value =>
      Array.isArray(value)
        ? yup
            .array()
            .of(
              yup.object().shape({
                value: yup.lazy(val =>
                  getMultiTypeFromValue(val as string) === MultiTypeInputType.FIXED
                    ? yup.string().matches(regexIdentifier, getString('validation.validOutputVariableRegex'))
                    : yup.string()
                )
              })
            )
            .test('valuesShouldBeUnique', getString('validation.uniqueValues'), outputVariables => {
              if (!outputVariables) return true

              return uniqBy(outputVariables, 'value').length === outputVariables.length
            })
        : yup.string()
    )
  }
}

export function generateSchemaForLimitMemory({ getString, isRequired = false }: GenerateSchemaDependencies): Lazy {
  return yup.lazy(value => {
    if (isRequired) {
      return getMultiTypeFromValue(value as string) === MultiTypeInputType.FIXED
        ? yup
            .string()
            .required()
            // ^$ in the end is to pass empty string because otherwise it will fail
            // .matches(/^\d+$|^\d+(E|P|T|G|M|K|Ei|Pi|Ti|Gi|Mi|Ki)$|^$/, getString('pipeline.stepCommonFields.validation.invalidLimitMemory'))
            .matches(
              /^\d+(\.\d+)?$|^\d+(\.\d+)?(G|M|Gi|Mi)$|^$/,
              getString('pipeline.stepCommonFields.validation.invalidLimitMemory')
            )
        : yup.string().required()
    }
    return getMultiTypeFromValue(value as string) === MultiTypeInputType.FIXED
      ? yup
          .string()
          // ^$ in the end is to pass empty string because otherwise it will fail
          // .matches(/^\d+$|^\d+(E|P|T|G|M|K|Ei|Pi|Ti|Gi|Mi|Ki)$|^$/, getString('pipeline.stepCommonFields.validation.invalidLimitMemory'))
          .matches(
            /^\d+(\.\d+)?$|^\d+(\.\d+)?(G|M|Gi|Mi)$|^$/,
            getString('pipeline.stepCommonFields.validation.invalidLimitMemory')
          )
      : yup.string()
  })
}

export function generateSchemaForLimitCPU({ getString }: GenerateSchemaDependencies): Lazy {
  return yup.lazy(value =>
    getMultiTypeFromValue(value as string) === MultiTypeInputType.FIXED
      ? // ^$ in the end is to pass empty string because otherwise it will fail
        yup
          .string()
          .matches(/^\d+(\.\d+)?$|^\d+m$|^$/, getString('pipeline.stepCommonFields.validation.invalidLimitCPU'))
      : yup.string()
  )
}

function generateSchemaForBoolean(): Lazy {
  return yup.lazy(value =>
    getMultiTypeFromValue(value as boolean) === MultiTypeInputType.FIXED ? yup.bool() : yup.string()
  )
}

function generateSchemaForKeyValue(
  { label, isRequired, isInputSet }: Field,
  { getString }: GenerateSchemaDependencies
): Lazy {
  return generateSchemaForMap(
    { label, isRequired, isInputSet } as Field,
    { getString },
    yup.object().shape(
      {
        key: yup.string().when('value', {
          is: val => val?.length,
          then: yup
            .string()
            .required(getString('validation.keyRequired'))
            .matches(portNumberRegex, getString('pipeline.ci.validations.port'))
        }),
        value: yup.string().when('key', {
          is: val => val?.length,
          then: yup.string().when('value', (value: string) => {
            if (!value) {
              return yup.string().required(getString('validation.valueRequired'))
            }
            if (value !== RUNTIME_INPUT_VALUE) {
              return yup.string().matches(portNumberRegex, getString('pipeline.ci.validations.port'))
            }
          })
        })
      },
      [['key', 'value']]
    )
  )
}

export function generateSchemaFields(
  fields: Field[],
  { initialValues, steps, serviceDependencies, getString }: GenerateSchemaDependencies,
  stepViewType: StepViewType,
  buildInfrastructureType?: K8sDirectInfraYaml['type']
): SchemaField[] {
  return fields.map(field => {
    const { name, type, label, isRequired, isActive } = field

    let validationRule

    if (type === Types.List) {
      validationRule = generateSchemaForList(field, { getString })
    }

    if (type === Types.Map) {
      validationRule = generateSchemaForMap(field, { getString })
    }

    if (stepViewType !== StepViewType.Template && type === Types.Identifier) {
      validationRule = generateSchemaForIdentifier({ initialValues, steps, serviceDependencies, getString })
    }

    if (stepViewType !== StepViewType.Template && type === Types.Name) {
      validationRule = generateSchemaForName({ getString })
    }

    if (type === Types.OutputVariables) {
      validationRule = generateSchemaForOutputVariables(field, { getString })
    }

    if (type === Types.LimitMemory) {
      validationRule = generateSchemaForLimitMemory({ getString })
    }

    if (type === Types.LimitCPU) {
      validationRule = generateSchemaForLimitCPU({ getString })
    }

    if (type === Types.Timeout) {
      validationRule = getDurationValidationSchema({ minimum: '10s' })
    }

    if (type === Types.Boolean) {
      validationRule = generateSchemaForBoolean()
    }
    if (type === Types.Numeric) {
      validationRule = generateSchemaForNumeric(field, { getString })
    }

    if (type === Types.Text) {
      validationRule = yup.string()
    }

    if (type === Types.KeyValue) {
      validationRule = generateSchemaForKeyValue(field, { getString })
    }

    if ((type === Types.Identifier || type === Types.Name || type === Types.Text) && isRequired && label) {
      if (validationRule) {
        validationRule = (validationRule as any).required(
          getString('fieldRequired', { field: getString(label as StringKeys) })
        )
        if (type === Types.Identifier) {
          if (buildInfrastructureType === 'VM') {
            validationRule = validationRule.matches(
              serviceDependencyIdRegex,
              getString('pipeline.ci.validations.serviceDependencyIdentifier', {
                regex: serviceDependencyIdRegex.source
              })
            )
          } else {
            validationRule = validationRule.matches(regexIdentifier, getString('validation.validIdRegex'))
          }
          validationRule = validationRule.notOneOf(illegalIdentifiers)
        }
      } else if (stepViewType !== StepViewType.Template && type !== Types.Identifier && type !== Types.Name) {
        validationRule = yup.string().required(getString('fieldRequired', { field: getString(label as StringKeys) }))
      }
    }

    if (type === Types.Boolean && isRequired && label) {
      validationRule = (validationRule as any).required(
        getString('fieldRequired', {
          field: getString(label as StringKeys)
        })
      )
    }

    return {
      name,
      validationRule,
      isActive
    }
  })
}

export function validate(
  values: any,
  config: Field[],
  dependencies: GenerateSchemaDependencies,
  stepViewType: StepViewType,
  buildInfrastructureType?: K8sDirectInfraYaml['type']
): FormikErrors<any> {
  const errors = {}
  if (isEmpty(dependencies.steps)) {
    dependencies.steps = []
  }
  if (isEmpty(dependencies.serviceDependencies)) {
    dependencies.serviceDependencies = []
  }
  const schemaFields = generateSchemaFields(config, dependencies, stepViewType, buildInfrastructureType)
  schemaFields.forEach(({ name, validationRule, isActive = true }) => {
    if (!isActive) return

    try {
      if (dependencies.type === StepType.Dependency && name === 'spec.limitMemory') {
        const cpuVal = get(values, 'spec.limitCPU')
        if (cpuVal) {
          generateSchemaForLimitMemory({ getString: dependencies.getString, isRequired: true }).validateSync(
            get(values, name)
          )
        }
      } else {
        validationRule?.validateSync(get(values, name))
      }
    } catch (error) {
      set(errors, name, error.message)
    }
  })

  return errors
}

export function validateInputSet(
  values: any,
  template: any,
  config: Field[],
  dependencies: GenerateSchemaDependencies,
  stepViewType: StepViewType
): FormikErrors<any> {
  const configWithActiveState = config.map(field => {
    return {
      ...field,
      isInputSet: true,
      isActive: !!get(template, field.name)
    }
  })

  return validate(values, configWithActiveState, dependencies, stepViewType)
}

export function getNameAndIdentifierSchema(
  getString: UseStringsReturn['getString'],
  stepViewType?: StepViewType
): { [key: string]: yup.Schema<string | undefined> } {
  return stepViewType !== StepViewType.Template
    ? {
        name: NameSchema({ requiredErrorMsg: getString('pipelineSteps.stepNameRequired') }),
        identifier: IdentifierSchema()
      }
    : {}
}
