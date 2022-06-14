/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { get, map } from 'lodash-es'
import cx from 'classnames'
import type { FormikContextType } from 'formik'
import { FormInput, Text, Color, Container, MultiSelectOption } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useListAwsRegions } from 'services/portal'
import { ConnectorMap, isRuntime, ConnectorLabelMap, ConnectorTypes } from '../../CloudFormationHelper'
import type { CreateStackData, CreateStackProps, Tags } from '../../CloudFormationInterfaces.types'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export default function TagsInputs<T extends CreateStackData = CreateStackData>(
  props: CreateStackProps<T> & { formik?: FormikContextType<any> }
): React.ReactElement {
  const { inputSetData, readonly, path, allowableTypes, formik } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [isAccount, setIsAccount] = useState<boolean>(false)
  const [regions, setRegions] = useState<MultiSelectOption[]>([])
  /* istanbul ignore next */
  const tags = inputSetData?.template?.spec?.configuration?.tags as Tags
  /* istanbul ignore next */
  const tagsConnectorType = tags?.spec?.store?.type
  /* istanbul ignore next */
  const newConnectorLabel = `${
    !!tagsConnectorType && getString(ConnectorLabelMap[tagsConnectorType as ConnectorTypes])
  } ${getString('connector')}`

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
  const regionRequired = get(tags?.spec?.store?.spec, 'region')
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
        <Text font={{ weight: 'bold' }}>{getString('cd.cloudFormation.remoteTags')}</Text>
      </Container>
      {
        /* istanbul ignore next */ tags?.type === 'Remote' &&
          isRuntime(tags?.spec?.store?.spec?.connectorRef as string) && (
            <div className={cx(stepCss.formGroup, stepCss.sm)}>
              <FormMultiTypeConnectorField
                label={<Text color={Color.GREY_900}>{newConnectorLabel}</Text>}
                type={ConnectorMap[tagsConnectorType as string]}
                name={`${path}.spec.configuration.tags.spec.store.spec.connectorRef`}
                placeholder={getString('select')}
                accountIdentifier={accountId}
                projectIdentifier={projectIdentifier}
                orgIdentifier={orgIdentifier}
                style={{ marginBottom: 10 }}
                multiTypeProps={{ expressions, allowableTypes }}
                disabled={readonly}
                setRefValue
                onChange={(value: any, _unused, _multiType) => {
                  const scope = value?.scope
                  let newConnectorRef: string
                  if (scope === 'org' || scope === 'account') {
                    newConnectorRef = `${scope}.${value?.record?.identifier}`
                    setIsAccount(scope === 'account')
                  } else {
                    newConnectorRef = value?.record?.identifier
                  }
                  /* istanbul ignore next */
                  formik?.setFieldValue(`${path}.spec.configuration.tags.spec.store.spec.connectorRef`, newConnectorRef)
                }}
              />
            </div>
          )
      }
      {
        /* istanbul ignore next */
        isRuntime(tags?.spec?.store?.spec?.region as string) && (
          <div className={cx(stepCss.formGroup, stepCss.sm)}>
            <FormInput.MultiTypeInput
              name={`${path}.spec.configuration.tags.spec.store.spec.region`}
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
        )
      }
      {/*
        *
        If a connector type of account is chosen
        we need to get the repo name to access the files
        *
        */}
      {
        /* istanbul ignore next */ tags?.type === 'Remote' &&
          (isAccount || isRuntime(tags?.spec?.store?.spec?.repoName as string)) && (
            <div className={cx(stepCss.formGroup, stepCss.sm)}>
              <FormInput.MultiTextInput
                name={`${path}.spec.configuration.tags.spec.store.spec.repoName`}
                label={getString('pipelineSteps.repoName')}
                disabled={readonly}
                multiTextInputProps={{
                  expressions,
                  allowableTypes
                }}
              />
            </div>
          )
      }
      {
        /* istanbul ignore next */ tags?.type === 'Remote' && isRuntime(tags?.spec?.store?.spec?.branch as string) && (
          <div className={cx(stepCss.formGroup, stepCss.sm)}>
            <FormInput.MultiTextInput
              name={`${path}.spec.configuration.tags.spec.store.spec.branch`}
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
      {
        /* istanbul ignore next */ tags?.type === 'Remote' && isRuntime(tags?.spec?.store?.spec?.commitId as string) && (
          <div className={cx(stepCss.formGroup, stepCss.sm)}>
            <FormInput.MultiTextInput
              name={`${path}.spec.configuration.tags.spec.store.spec.commitId`}
              label={getString('pipeline.manifestType.commitId')}
              disabled={readonly}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          </div>
        )
      }
      {
        /* istanbul ignore next */ tags?.type === 'Remote' && isRuntime(tags?.spec?.store?.spec?.paths as string) && (
          <div className={cx(stepCss.formGroup, stepCss.sm)}>
            <FormInput.MultiTextInput
              name={`${path}.spec.configuration.tags.spec.store.spec.paths[0]`}
              label={getString('common.git.filePath')}
              disabled={readonly}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          </div>
        )
      }
    </>
  )
}
