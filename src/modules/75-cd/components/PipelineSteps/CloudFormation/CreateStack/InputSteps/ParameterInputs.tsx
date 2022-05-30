/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { map, get, some } from 'lodash-es'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { FormikContextType, FieldArray } from 'formik'
import {
  FormInput,
  Text,
  Color,
  Container,
  Layout,
  Icon,
  Button,
  ButtonVariation,
  MultiSelectOption
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useListAwsRegions } from 'services/portal'
import { ConnectorMap, ConnectorLabelMap, ConnectorTypes, isRuntime } from '../../CloudFormationHelper'
import type { CreateStackData, CreateStackProps } from '../../CloudFormationInterfaces.types'
import { onDragStart, onDragEnd, onDragLeave, onDragOver, onDrop } from '../../DragHelper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../../CloudFormation.module.scss'

export default function ParameterFileInputs<T extends CreateStackData = CreateStackData>(
  props: CreateStackProps<T> & { formik?: FormikContextType<any> }
): React.ReactElement {
  const { inputSetData, readonly, path, allowableTypes, formik } = props

  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [isAccount, setIsAccount] = useState<boolean>(false)
  const [regions, setRegions] = useState<MultiSelectOption[]>([])

  const {
    data: regionData,
    loading: regionsLoading,
    refetch: getRegions
  } = useListAwsRegions({
    lazy: true,
    queryParams: {
      accountId
    }
  })
  /* istanbul ignore next */
  const regionRequired = some(inputSetData?.template?.spec?.configuration?.parameters, 'store.spec.region')
  useEffect(() => {
    /* istanbul ignore next */
    if (regionData) {
      const regionValues = map(regionData.resource, reg => ({ label: reg.name, value: reg.value }))
      setRegions(regionValues as MultiSelectOption[])
    }

    /* istanbul ignore next */
    if (!regionData && regionRequired && !regionsLoading) {
      getRegions()
    }
  }, [regionData, regionRequired, regionsLoading])

  return (
    <>
      <Container flex width={120} padding={{ bottom: 'small' }}>
        <Text font={{ weight: 'bold' }}>{getString('cd.cloudFormation.parameterFileDetails')}</Text>
      </Container>
      {map(inputSetData?.template?.spec?.configuration?.parameters, (param, i) => {
        /* istanbul ignore next */ // jest doesn't recognize optionals as covered branches
        const pathNeeded = param?.store?.spec?.paths
        /* istanbul ignore next */ // jest doesn't recognize optionals as covered branches
        const urlsNeeded = param?.store?.spec?.urls
        const pathName = `${path}.spec.configuration.parameters[${i}].store.spec.${pathNeeded ? 'paths' : 'urls'}`
        const filePaths = get(formik?.values, pathName) || ['']
        const type = param?.store?.type === 'S3Url' ? 'S3' : param?.store?.type
        const newConnectorLabel = `${getString(ConnectorLabelMap[type as ConnectorTypes])} ${getString('connector')}`
        return (
          <div key={`param${i}`}>
            {
              /* istanbul ignore next */
              isRuntime(param?.store?.spec?.connectorRef as string) && (
                <div className={cx(stepCss.formGroup, stepCss.sm)}>
                  <FormMultiTypeConnectorField
                    label={<Text color={Color.GREY_900}>{newConnectorLabel}</Text>}
                    type={ConnectorMap[type]}
                    name={`${path}.spec.configuration.parameters[${i}].store.spec.connectorRef`}
                    placeholder={getString('select')}
                    accountIdentifier={accountId}
                    projectIdentifier={projectIdentifier}
                    orgIdentifier={orgIdentifier}
                    style={{ marginBottom: 10 }}
                    multiTypeProps={{ expressions, allowableTypes }}
                    disabled={readonly}
                    onChange={(value: any, _unused, _notUsed) => {
                      /* istanbul ignore next */
                      setIsAccount(value?.record?.spec?.type === 'Account')
                      /* istanbul ignore next */
                      formik?.setFieldValue(
                        `${path}.spec.configuration.parameters[${i}].store.spec.connectorRef`,
                        value?.record?.identifier
                      )
                    }}
                    setRefValue
                  />
                </div>
              )
            }
            {isRuntime(param?.store?.spec?.region as string) && (
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormInput.MultiTypeInput
                  name={`${path}.spec.configuration.parameters[${i}].store.spec.region`}
                  label={getString('regionLabel')}
                  placeholder={getString(regionsLoading ? 'common.loading' : 'pipeline.regionPlaceholder')}
                  disabled={readonly}
                  useValue
                  multiTypeInputProps={{
                    selectProps: {
                      allowCreatingNewItems: true,
                      items: regions
                    },
                    expressions,
                    allowableTypes
                  }}
                  selectItems={regions}
                />
              </div>
            )}
            {/*
              *
              If a connector type of account is chosen
              we need to get the repo name to access the files
              *
              */}
            {(isAccount || isRuntime(param?.store?.spec?.repoName as string)) && (
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormInput.MultiTextInput
                  name={`${path}.spec.configuration.parameters[${i}].store.spec.repoName`}
                  label={getString('pipelineSteps.repoName')}
                  disabled={readonly}
                  multiTextInputProps={{
                    expressions,
                    allowableTypes
                  }}
                />
              </div>
            )}
            {isRuntime(param?.store?.spec?.branch as string) && (
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormInput.MultiTextInput
                  name={`${path}.spec.configuration.parameters[${i}].store.spec.branch`}
                  label={getString('pipelineSteps.deploy.inputSet.branch')}
                  disabled={readonly}
                  multiTextInputProps={{
                    expressions,
                    allowableTypes
                  }}
                />
              </div>
            )}
            {
              /* istanbul ignore next */
              isRuntime(param?.store?.spec?.commitId as string) && (
                <div className={cx(stepCss.formGroup, stepCss.sm)}>
                  <FormInput.MultiTextInput
                    name={`${path}.spec.configuration.parameters[${i}].store.spec.commitId`}
                    label={getString('pipelineSteps.deploy.inputSet.branch')}
                    disabled={readonly}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                  />
                </div>
              )
            }
            {isRuntime((pathNeeded as string) || (urlsNeeded as string)) && (
              <div className={cx(stepCss.formGroup, stepCss.md)}>
                <Layout.Vertical>
                  <Container padding={{ bottom: 'small' }}>
                    <Text font={{ weight: 'bold' }}>{getString('filePaths')}</Text>
                  </Container>
                  <FieldArray
                    name={pathName}
                    render={arrayHelpers => (
                      <>
                        {map(filePaths, (_: string, n: number) => (
                          <Layout.Horizontal
                            key={`filePath-${n}`}
                            flex={{ distribution: 'space-between' }}
                            style={{ alignItems: 'end' }}
                          >
                            <Layout.Horizontal
                              spacing="medium"
                              style={{ alignItems: 'baseline' }}
                              className={css.formContainer}
                              key={`filePath-${n}`}
                              draggable={true}
                              onDragEnd={onDragEnd}
                              onDragOver={onDragOver}
                              onDragLeave={onDragLeave}
                              onDragStart={event => onDragStart(event, n)}
                              onDrop={event => {
                                /* istanbul ignore next */
                                onDrop(event, arrayHelpers, n)
                              }}
                              data-testid={`filePath-${n}`}
                            >
                              <Icon name="drag-handle-vertical" className={css.drag} />
                              <Text width={12}>{`${n + 1}.`}</Text>
                              <FormInput.MultiTextInput
                                name={`${pathName}[${n}]`}
                                label=""
                                multiTextInputProps={{
                                  expressions,
                                  allowableTypes
                                }}
                                style={{ width: 320 }}
                              />
                              <Button
                                minimal
                                icon="main-trash"
                                data-testid={`remove-header-${n}`}
                                onClick={() => arrayHelpers.remove(n)}
                              />
                            </Layout.Horizontal>
                          </Layout.Horizontal>
                        ))}
                        <Button
                          icon="plus"
                          variation={ButtonVariation.LINK}
                          data-testid="add-header"
                          onClick={() => arrayHelpers.push('')}
                        >
                          {getString('cd.addTFVarFileLabel')}
                        </Button>
                      </>
                    )}
                  />
                </Layout.Vertical>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
