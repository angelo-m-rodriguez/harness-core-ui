/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { Form } from 'formik'
import { unset, find } from 'lodash-es'
import { useParams } from 'react-router-dom'
import {
  Layout,
  Heading,
  Formik,
  Card,
  Icon,
  Text,
  Color,
  Button,
  ButtonVariation,
  ButtonSize,
  StepProps,
  MultiTypeInput,
  MultiTypeInputType,
  getMultiTypeFromValue,
  MultiSelectOption
} from '@harness/uicore'
import * as Yup from 'yup'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  AllowedTypes,
  ConnectorIcons,
  ConnectorMap,
  ConnectorLabelMap,
  ConnectorTypes,
  isRuntime
} from '../../CloudFormationHelper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../RemoteFilesForm/AWSConnector.module.scss'

const S3 = 'S3'
interface StepOneProps {
  isReadonly: boolean
  allowableTypes: MultiTypeInputType[]
  setShowNewConnector: (bool: boolean) => void
  selectedConnector: string
  setSelectedConnector: (type: string) => void
  initialValues: any
  regions: MultiSelectOption[]
}

const TagsStepOne: React.FC<StepProps<any> & StepOneProps> = ({
  allowableTypes,
  isReadonly = false,
  nextStep,
  setShowNewConnector,
  selectedConnector,
  setSelectedConnector,
  initialValues,
  regions
}) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const newConnectorLabel = `${getString('newLabel')} ${
    !!selectedConnector && getString(ConnectorLabelMap[selectedConnector as ConnectorTypes])
  } ${getString('connector')}`

  useEffect(() => {
    const connectorType = initialValues?.spec?.configuration?.tags?.spec?.store?.type
    if (connectorType) {
      setSelectedConnector(connectorType === 'S3Url' ? S3 : connectorType)
    } else {
      setSelectedConnector(AllowedTypes[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  const validationSchema = Yup.object().shape({
    type: Yup.string(),
    spec: Yup.object().shape({
      store: Yup.object().shape({
        spec: Yup.object().shape({
          connectorRef: Yup.string().required(getString('pipelineSteps.build.create.connectorRequiredError'))
        })
      })
    })
  })
  const isS3 = !!selectedConnector && selectedConnector === S3
  return (
    <Layout.Vertical padding="small" className={css.awsForm}>
      <Heading level={2} style={{ color: Color.BLACK, fontSize: 24, fontWeight: 'bold' }} margin={{ bottom: 'xlarge' }}>
        {getString('cd.cloudFormation.remoteTagsConnector')}
      </Heading>
      <Formik
        formName="awsConnector"
        enableReinitialize={true}
        onSubmit={data => {
          setSelectedConnector('')
          unset(data, 'identifier')
          /* istanbul ignore next */
          nextStep?.({ ...data, selectedConnector })
        }}
        initialValues={initialValues?.spec?.configuration?.tags}
        validationSchema={validationSchema}
      >
        {({ values, setFieldValue }) => {
          const connectorRef = values?.spec?.store?.spec?.connectorRef
          const region = values.spec?.store?.spec?.region
          const isFixedValue = getMultiTypeFromValue(connectorRef) === MultiTypeInputType.FIXED
          const disabled =
            !selectedConnector || (isFixedValue && !connectorRef?.connector) || (isS3 && !isRuntime(region) && !region)
          return (
            <>
              <Layout.Horizontal className={css.horizontalFlex} margin={{ top: 'xlarge', bottom: 'xlarge' }}>
                {AllowedTypes.map(item => (
                  <div key={item} className={css.squareCardContainer}>
                    <Card
                      className={css.connectorIcon}
                      selected={item === selectedConnector}
                      data-testid={`connector-${item}`}
                      onClick={() => {
                        setSelectedConnector(item as ConnectorTypes)
                        if (isFixedValue) {
                          setFieldValue('spec.store.spec.connectorRef', '')
                        }
                      }}
                    >
                      <Icon name={ConnectorIcons[item]} size={26} />
                    </Card>
                    <Text color={Color.BLACK_100}>{item}</Text>
                  </div>
                ))}
              </Layout.Horizontal>
              <Form className={css.formComponent}>
                <div className={css.formContainerStepOne}>
                  <Layout.Horizontal className={css.horizontalFlex} spacing={'medium'}>
                    <FormMultiTypeConnectorField
                      label={
                        <Text style={{ display: 'flex', alignItems: 'center' }}>
                          {ConnectorMap[selectedConnector]} {getString('connector')}
                          <Button icon="question" minimal iconProps={{ size: 14 }} />
                        </Text>
                      }
                      type={ConnectorMap[selectedConnector]}
                      width={400}
                      name="spec.store.spec.connectorRef"
                      placeholder={getString('select')}
                      accountIdentifier={accountId}
                      projectIdentifier={projectIdentifier}
                      orgIdentifier={orgIdentifier}
                      style={{ marginBottom: 10 }}
                      multiTypeProps={{ expressions, allowableTypes }}
                    />
                    {selectedConnector && (
                      <Button
                        className={css.newConnectorButton}
                        variation={ButtonVariation.LINK}
                        size={ButtonSize.SMALL}
                        disabled={isReadonly}
                        id="new-connector"
                        text={newConnectorLabel}
                        icon="plus"
                        iconProps={{ size: 12 }}
                        onClick={() => {
                          setShowNewConnector(true)
                          /* istanbul ignore next */
                          nextStep?.({ ...initialValues, selectedConnector })
                        }}
                        data-testid="new-connector"
                      />
                    )}
                  </Layout.Horizontal>
                  {isS3 && (
                    <Layout.Horizontal>
                      <Layout.Horizontal className={stepCss.formGroup}>
                        <MultiTypeInput
                          name="store.spec.region"
                          selectProps={{
                            addClearBtn: false,
                            items: regions
                          }}
                          width={300}
                          value={find(regions, ['value', region]) || region}
                          onChange={(reg: any) => {
                            /* istanbul ignore next */
                            setFieldValue('spec.store.spec.region', reg?.value || reg)
                          }}
                        />
                      </Layout.Horizontal>
                    </Layout.Horizontal>
                  )}
                </div>
                <Layout.Horizontal spacing="xxlarge">
                  <Button
                    variation={ButtonVariation.PRIMARY}
                    type="submit"
                    text={getString('continue')}
                    rightIcon="chevron-right"
                    disabled={disabled}
                    data-testid="submit"
                  />
                </Layout.Horizontal>
              </Form>
            </>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default TagsStepOne
