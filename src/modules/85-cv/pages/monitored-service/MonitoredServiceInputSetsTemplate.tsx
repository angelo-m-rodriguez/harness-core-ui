/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { cloneDeep, defaultTo, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { useHistory, useParams } from 'react-router-dom'
import {
  Button,
  ButtonVariation,
  Card,
  Color,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Icon,
  Layout,
  MultiTypeInputType,
  Page,
  PageSpinner,
  TableV2,
  Text,
  useToaster
} from '@harness/uicore'
import routes from '@common/RouteDefinitions'
import { useQueryParams } from '@common/hooks'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { FormConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/FormConnectorReferenceField'
import { useGetTemplate, useGetTemplateInputSetYaml } from 'services/template-ng'
import { useSaveMonitoredServiceFromYaml } from 'services/cv'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import {
  useGetHarnessEnvironments,
  useGetHarnessServices
} from '@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { getIconBySourceType } from '../health-source/HealthSourceTable/HealthSourceTable.utils'
import css from './MonitoredServicePage.module.scss'

const spacingMedium = 'var(--spacing-medium)'
export const getNestedRuntimeInputs = (spec: any, list: any[], basePath: string): { name: string; path: string }[] => {
  let clonedList = cloneDeep(list)
  Object.entries(spec).forEach(item => {
    if (getMultiTypeFromValue(item[1] as string) === MultiTypeInputType.RUNTIME) {
      clonedList.push({ name: item[0], path: `${basePath}.${item[0]}` })
    } else if (typeof item[1] === 'object') {
      if (Array.isArray(item[1])) {
        item[1].forEach((metric, index) => {
          clonedList = getNestedRuntimeInputs(metric, clonedList, `${basePath}.${item[0]}.${index}`)
        })
      } else {
        clonedList = getNestedRuntimeInputs(spec[item[0]], clonedList, `${basePath}.${item[0]}`)
      }
    }
  })
  return clonedList
}

export const getLabelByName = (name: string, getString: UseStringsReturn['getString']) => {
  switch (name) {
    case 'applicationName':
      return getString('cv.healthSource.connectors.AppDynamics.applicationLabel')
    case 'tierName':
      return getString('cv.healthSource.connectors.AppDynamics.trierLabel')
    case 'completeMetricPath':
      return getString('cv.healthSource.connectors.AppDynamics.metricPathType.text')
    case 'serviceInstanceMetricPath':
      return getString('cv.healthSource.connectors.AppDynamics.serviceInstance')
    case 'connectorRef':
      return getString('connectors.selectConnector')
    default:
      return ''
  }
}

interface TemplateDataInterface {
  identifier: string
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  versionLabel: string
}

export default function MonitoredServiceInputSetsTemplate({ templateData }: { templateData?: TemplateDataInterface }) {
  const { templateRef } = useQueryParams<{ templateRef?: string }>()
  const isTemplateDrawer = Boolean(templateData)
  const templateRefData: TemplateDataInterface = isTemplateDrawer ? templateData : JSON.parse(templateRef || '{}')
  const { getString } = useStrings()
  const history = useHistory()
  const { showSuccess, showError } = useToaster()
  const { serviceOptions } = useGetHarnessServices()
  const { environmentOptions } = useGetHarnessEnvironments()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const pathParams = {
    accountId,
    orgIdentifier,
    projectIdentifier
  }

  const [showLoading, setShowLoading] = React.useState(false)

  // InputSet Yaml
  const { data: templateInputYaml, loading: loadingTemplateYaml } = useGetTemplateInputSetYaml({
    templateIdentifier: defaultTo(templateRefData?.identifier, ''),
    queryParams: {
      accountIdentifier: templateRefData?.accountId,
      orgIdentifier: templateRefData?.orgIdentifier,
      projectIdentifier: templateRefData?.projectIdentifier,
      versionLabel: defaultTo(templateRefData?.versionLabel, ''),
      getDefaultFromOtherRepo: true
    }
  })

  // Complete Yaml of Template
  const { data: stepTemplateResponse, loading: stepTemplateLoading } = useGetTemplate({
    templateIdentifier: templateRefData?.identifier,
    queryParams: {
      accountIdentifier: templateRefData?.accountId,
      orgIdentifier: templateRefData?.orgIdentifier,
      projectIdentifier: templateRefData?.projectIdentifier,
      versionLabel: defaultTo(templateRefData?.versionLabel, ''),
      getDefaultFromOtherRepo: true
    }
  })

  // default value for formik
  const [isInputSetCreated, setInputSet] = React.useState(false)
  const [monitoredServiceInputSet, setMonitoredServiceInputSet] = React.useState<any>({})
  const [monitoredServiceYaml, setMonitoredServiceYaml] = React.useState<any>({})

  // Set InputSet Yaml as state variable
  React.useEffect(() => {
    if (templateInputYaml && templateInputYaml?.data && !isInputSetCreated && !loadingTemplateYaml) {
      const inputSet = isTemplateDrawer
        ? parse(templateInputYaml?.data)
        : (parse(templateInputYaml?.data?.replace(/"<\+input>"/g, '""')) as any)
      setMonitoredServiceInputSet(inputSet)
      setInputSet(true)
    }
  }, [templateInputYaml])

  // Set complete Yaml as state variable
  React.useEffect(() => {
    if (stepTemplateResponse && stepTemplateResponse?.data?.yaml) {
      const yaml = parse(stepTemplateResponse?.data?.yaml) as any
      setMonitoredServiceYaml(yaml?.template)
    }
  }, [stepTemplateResponse])

  const { mutate: refetchSaveTemplateYaml } = useSaveMonitoredServiceFromYaml({
    queryParams: {
      accountId: templateRefData?.accountId,
      orgIdentifier: templateRefData?.orgIdentifier,
      projectIdentifier: templateRefData?.projectIdentifier
    }
  })

  const onSave = async (value: any) => {
    monitoredServiceInputSet.serviceRef = value.serviceRef?.value
    monitoredServiceInputSet.environmentRef = value.environmentRef?.value
    const populateSource = value.sources ? { sources: value.sources } : {}
    const populateVariables = value.variables ? { variables: value.variables } : {}
    const structure = {
      monitoredService: {
        template: {
          templateRef: templateRefData?.identifier,
          versionLabel: templateRefData?.versionLabel,
          templateInputs: {
            ...monitoredServiceInputSet,
            ...populateSource,
            ...populateVariables
          }
        }
      }
    }
    setShowLoading(true)
    refetchSaveTemplateYaml(yamlStringify(structure))
      .then(() => {
        showSuccess(getString('cv.monitoredServices.monitoredServiceCreated'))
        history.push({
          pathname: routes.toCVMonitoringServices(pathParams)
        })
      })
      .catch(error => {
        setShowLoading(false)
        showError(getErrorMessage(error))
      })
  }

  // To render table and Inputs
  const healthSourcesVariables = monitoredServiceInputSet.variables
  const healthSources = monitoredServiceYaml?.spec?.sources?.healthSources
  const tableData =
    healthSources?.map((healthSource: any) => {
      const { name, spec, type } = healthSource
      return {
        healthSource: name,
        connector: spec?.connectorRef,
        feature: spec?.feature,
        type
      }
    }) || []

  if (loadingTemplateYaml || stepTemplateLoading) {
    return <PageSpinner />
  } else if (!monitoredServiceInputSet || isEmpty(monitoredServiceInputSet)) {
    return <NoResultsView text={'No Runtime inputs available'} minimal={true} />
  }

  return (
    <>
      {!isTemplateDrawer && <Page.Header size="large" title={'Template Inputs'} />}

      <Formik
        formName="MonitoredServiceForm"
        onSubmit={async value => await onSave(value)}
        initialValues={monitoredServiceInputSet}
        enableReinitialize
      >
        {formik => {
          return (
            <div className={css.inputsetContainer}>
              <Layout.Vertical>
                <Card className={css.serviceAndEnv}>
                  <Text font={'medium'} color={Color.BLACK} style={{ paddingBottom: spacingMedium }}>
                    {getString('cv.monitoredServices.serviceAndEnvironment')}
                  </Text>
                  <FormInput.MultiTypeInput
                    name={'serviceRef'}
                    label={getString('cv.healthSource.serviceLabel')}
                    selectItems={serviceOptions}
                  />
                  <FormInput.MultiTypeInput
                    name={'environmentRef'}
                    label={getString('cv.healthSource.environmentLabel')}
                    selectItems={environmentOptions}
                  />
                </Card>
                {Boolean(tableData?.length) && (
                  <Card className={css.serviceAndEnv}>
                    <Text font={'medium'} color={Color.BLACK} style={{ paddingBottom: spacingMedium }}>
                      {getString('cv.templates.healthSourceDetails')}
                    </Text>
                    <TableV2
                      data={tableData}
                      columns={[
                        {
                          Header: 'Health Source',
                          accessor: function accessor(row: any) {
                            return (
                              <Layout.Horizontal>
                                <Icon name={getIconBySourceType(row.type)} margin={{ right: 'medium' }} />
                                <Text>{row.healthSource}</Text>
                              </Layout.Horizontal>
                            )
                          },
                          id: 'healthSource'
                        },
                        {
                          Header: 'Connector',
                          accessor: function accessor(row: any) {
                            return <Text className={css.healthSourceTableItem}>{row.connector}</Text>
                          },
                          id: 'connector'
                        },
                        {
                          Header: 'Feature',
                          accessor: function accessor(row: any) {
                            return <Text>{row.feature}</Text>
                          },
                          id: 'feature'
                        }
                      ]}
                    />
                  </Card>
                )}
                {healthSources?.map((healthSource: any, index: number) => {
                  const spec = healthSource?.spec
                  const path = `sources.healthSources.${index}.spec`
                  const runtimeInputs = Object.entries(spec)
                    .filter(item => item[1] === '<+input>')
                    .map(item => {
                      return { name: item[0], path: `${path}.${item[0]}` }
                    })
                  const metricDefinitions = healthSource?.spec?.metricDefinitions
                  return (
                    <Card key={`${healthSource?.name}.${index}`} className={css.serviceAndEnv}>
                      <Text font={'normal'} color={Color.BLACK} style={{ paddingBottom: spacingMedium }}>
                        {getString('cv.healthSource.nameLabel')}: {healthSource?.name}
                      </Text>
                      {runtimeInputs.length ? (
                        runtimeInputs.map(input => {
                          if (input.name === 'connectorRef' && !isTemplateDrawer) {
                            return (
                              <FormConnectorReferenceField
                                width={400}
                                formik={formik}
                                type={healthSource?.type}
                                name={input.path}
                                label={
                                  <Text color={Color.BLACK} font={'small'} margin={{ bottom: 'small' }}>
                                    {getString('connectors.selectConnector')}
                                  </Text>
                                }
                                accountIdentifier={accountId}
                                projectIdentifier={projectIdentifier}
                                orgIdentifier={orgIdentifier}
                                placeholder={getString('cv.healthSource.connectors.selectConnector', {
                                  sourceType: formik?.values?.sourceType
                                })}
                                tooltipProps={{ dataTooltipId: 'selectHealthSourceConnector' }}
                              />
                            )
                          } else {
                            return (
                              <>
                                <FormInput.MultiTextInput
                                  key={input.name}
                                  name={input.path}
                                  label={getLabelByName(input.name, getString)}
                                  multiTextInputProps={{ allowableTypes: [MultiTypeInputType.FIXED] }}
                                />
                              </>
                            )
                          }
                        })
                      ) : (
                        <NoResultsView text={'No Runtime inputs available'} minimal={true} />
                      )}
                      <Layout.Vertical>
                        {metricDefinitions?.map((item: any, idx: number) => {
                          const runtimeItems = getNestedRuntimeInputs(item, [], `${path}.metricDefinitions.${idx}`)
                          return (
                            <>
                              <Text font={'normal'} color={Color.BLACK} style={{ paddingBottom: spacingMedium }}>
                                {getString('cv.monitoringSources.metricLabel')}: {item?.metricName}
                              </Text>
                              {runtimeItems.map(input => {
                                return (
                                  <FormInput.MultiTextInput
                                    key={input.name}
                                    name={input.path}
                                    label={getLabelByName(input.name, getString)}
                                    multiTextInputProps={{ allowableTypes: [MultiTypeInputType.FIXED] }}
                                  />
                                )
                              })}
                            </>
                          )
                        })}
                      </Layout.Vertical>
                    </Card>
                  )
                })}
                {Boolean(healthSourcesVariables?.length) && (
                  <Card className={css.serviceAndEnv}>
                    <Text font={'normal'} style={{ paddingBottom: spacingMedium }}>
                      {getString('common.variables')}
                    </Text>
                    {healthSourcesVariables?.map((variable: any, index: number) => {
                      return (
                        <FormInput.MultiTextInput
                          key={variable?.name}
                          name={`variables.${index}.value`}
                          label={variable?.name}
                          multiTextInputProps={{ allowableTypes: [MultiTypeInputType.FIXED] }}
                        />
                      )
                    })}
                  </Card>
                )}
                {!isTemplateDrawer && (
                  <Card className={css.serviceAndEnv}>
                    <Button
                      disabled={showLoading}
                      loading={showLoading}
                      variation={ButtonVariation.PRIMARY}
                      onClick={async () => await formik.submitForm()}
                    >
                      {getString('submit')}
                    </Button>
                  </Card>
                )}
              </Layout.Vertical>
            </div>
          )
        }}
      </Formik>
    </>
  )
}
