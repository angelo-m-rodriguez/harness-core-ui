/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import {
  Button,
  ButtonVariation,
  Text,
  Formik,
  FormikForm,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  StepProps,
  ButtonSize
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { set } from 'lodash-es'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { ConnectorSelectedValue } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useQueryParams } from '@common/hooks'
import { ArtifactConnectorLabelMap, ArtifactToConnectorMap } from '../ArtifactHelper'
import type { ArtifactType, InitialArtifactDataType } from '../ArtifactInterface'

import css from './ArtifactConnector.module.scss'
interface ArtifactConnectorProps {
  handleViewChange: () => void
  expressions: string[]
  stepName: string
  isReadonly: boolean
  initialValues: InitialArtifactDataType
  selectedArtifact: ArtifactType | null
  allowableTypes: MultiTypeInputType[]
}

export function ArtifactConnector(props: StepProps<ConnectorConfigDTO> & ArtifactConnectorProps): React.ReactElement {
  const {
    previousStep,
    prevStepData,
    nextStep,
    initialValues,
    stepName,
    expressions,
    selectedArtifact,
    isReadonly,
    handleViewChange,
    allowableTypes
  } = props

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const connectorType = ArtifactToConnectorMap[selectedArtifact as ArtifactType]
  const selectedConnectorLabel = ArtifactConnectorLabelMap[selectedArtifact as ArtifactType]
  const selectedConnectorTooltip = ArtifactToConnectorMap[selectedArtifact as ArtifactType]

  const newConnectorLabel = `${getString('newLabel')} ${selectedConnectorLabel} ${getString('connector')}`

  const [canCreate] = usePermission({
    resource: {
      resourceType: ResourceType.CONNECTOR
    },
    permissions: [PermissionIdentifier.UPDATE_CONNECTOR]
  })

  const primarySchema = Yup.object().shape({
    connectorId: Yup.string()
      .trim()
      .required(`${connectorType} ${getString('pipelineSteps.build.create.connectorRequiredError')}`)
  })

  const submitFirstStep = async (formData: any): Promise<void> => {
    nextStep?.({ ...formData })
  }
  const getInitialValues = useCallback((): InitialArtifactDataType => {
    if (prevStepData?.connectorId !== undefined) {
      set(initialValues, 'connectorId', prevStepData?.connectorId)
    }
    return initialValues
  }, [initialValues, prevStepData?.connectorId])

  return (
    <Layout.Vertical spacing="xxlarge" className={css.firstep}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {stepName}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        validationSchema={primarySchema}
        formName="artifactConnForm"
        onSubmit={formData => {
          submitFirstStep(formData)
        }}
      >
        {formik => (
          <FormikForm>
            <div className={css.connectorForm}>
              <Layout.Horizontal
                spacing={'medium'}
                flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
                className={css.connectorContainer}
              >
                <FormMultiTypeConnectorField
                  name="connectorId"
                  tooltipProps={{ dataTooltipId: `connectorId_${selectedConnectorTooltip}` }}
                  label={`${selectedConnectorLabel} ${getString('connector')}`}
                  placeholder={`${getString('select')} ${selectedConnectorLabel} ${getString('connector')}`}
                  accountIdentifier={accountId}
                  projectIdentifier={projectIdentifier}
                  orgIdentifier={orgIdentifier}
                  width={400}
                  multiTypeProps={{ expressions, allowableTypes }}
                  isNewConnectorLabelVisible={
                    !(
                      getMultiTypeFromValue(formik.values.connectorId) === MultiTypeInputType.RUNTIME &&
                      (isReadonly || !canCreate)
                    )
                  }
                  createNewLabel={newConnectorLabel}
                  type={connectorType}
                  enableConfigureOptions={false}
                  selected={formik?.values?.connectorId}
                  gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                />
                {getMultiTypeFromValue(formik.values.connectorId) === MultiTypeInputType.RUNTIME ? (
                  <ConfigureOptions
                    className={css.configureOptions}
                    value={formik.values.connectorId as unknown as string}
                    type={connectorType}
                    variableName="connectorRef"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      formik.setFieldValue('connectorId', value)
                    }}
                    isReadonly={isReadonly}
                  />
                ) : (
                  <Button
                    variation={ButtonVariation.LINK}
                    size={ButtonSize.SMALL}
                    id="new-artifact-connector"
                    text={newConnectorLabel}
                    icon="plus"
                    iconProps={{ size: 12 }}
                    disabled={isReadonly || !canCreate}
                    onClick={() => {
                      handleViewChange()
                      nextStep?.()
                    }}
                    className={css.addNewArtifact}
                  />
                )}
              </Layout.Horizontal>
            </div>
            <Layout.Horizontal spacing="medium">
              <Button
                variation={ButtonVariation.SECONDARY}
                text={getString('back')}
                icon="chevron-left"
                onClick={() => previousStep?.(prevStepData)}
              />
              <Button
                variation={ButtonVariation.PRIMARY}
                type="submit"
                text={getString('continue')}
                rightIcon="chevron-right"
                disabled={
                  getMultiTypeFromValue(formik.values.connectorId) === MultiTypeInputType.FIXED &&
                  !(formik.values.connectorId as ConnectorSelectedValue)?.connector
                }
              />
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </Layout.Vertical>
  )
}
