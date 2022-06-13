/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  ButtonVariation,
  Card,
  Container,
  Formik,
  FormikForm,
  Layout,
  Link,
  Text
} from '@wings-software/uicore'
import { debounce, get, noop, set } from 'lodash-es'
import type { FormikProps } from 'formik'
import { Color, FontVariation } from '@wings-software/design-system'
import cx from 'classnames'
import { parse } from 'yaml'
import type { StrategyConfig } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import {
  AvailableStrategies,
  LoopingStrategyEnum,
  Strategy
} from '@pipeline/components/PipelineStudio/LoopingStrategy/LoopingStrategyUtils'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import css from './LoopingStrategy.module.scss'

export interface LoopingStrategyProps {
  strategy?: StrategyConfig
  isReadonly: boolean
  onUpdateStrategy: (strategy: StrategyConfig) => void
}

const DOCUMENT_URL = 'https://ngdocs.harness.io/article/i36ibenkq2-step-skip-condition-settings'

export function LoopingStrategy({
  strategy = {},
  isReadonly,
  onUpdateStrategy
}: LoopingStrategyProps): React.ReactElement {
  const { getString } = useStrings()
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()

  const debouncedUpdate = React.useCallback(
    debounce((strategyConfig: StrategyConfig): void => {
      onUpdateStrategy(strategyConfig)
    }, 300),
    [onUpdateStrategy]
  )

  const onStrategyChange = (
    _isEditorDirty: boolean,
    formikProps: FormikProps<StrategyConfig>,
    selectedStrategy: LoopingStrategyEnum
  ): void => {
    try {
      const newValues: StrategyConfig = set({}, selectedStrategy, parse(yamlHandler?.getLatestYaml() || ''))
      formikProps.setValues(newValues)
    } catch {
      // this catch intentionally left empty
    }
  }

  const getAllStrategies = (
    selectedStrategy: StrategyConfig
  ): {
    label: string
    value: LoopingStrategyEnum
    selected: boolean
    disabled: boolean
  }[] =>
    AvailableStrategies.map(item => ({
      label: item.label,
      value: item.value,
      selected: !!get(selectedStrategy, item.value),
      disabled: isReadonly
    }))

  const getSelectedStrategyMetaData = (selectedStrategy: StrategyConfig): Strategy | undefined =>
    AvailableStrategies.find(item => !!get(selectedStrategy, item.value))

  const changeStrategy = (newStrategy: LoopingStrategyEnum, formikProps: FormikProps<StrategyConfig>) => {
    const newValues: StrategyConfig = set({}, newStrategy, {})
    formikProps.setValues(newValues)
  }

  const onDelete = React.useCallback(
    async (formikProps: FormikProps<StrategyConfig>) => {
      formikProps.setValues({})
    },
    [onUpdateStrategy]
  )

  const renderCustomHeader = (): JSX.Element => <Container></Container>

  return (
    <Formik initialValues={strategy} formName="loopingStrategy" onSubmit={noop} validate={debouncedUpdate}>
      {(formikProps: FormikProps<StrategyConfig>) => {
        const selectedStrategyMetaData = getSelectedStrategyMetaData(formikProps.values)
        return (
          <FormikForm>
            <Container width={846} className={css.mainContainer}>
              <Layout.Vertical spacing={'medium'}>
                <Text color={Color.GREY_700} font={{ size: 'small' }}>
                  {getString('pipeline.loopingStrategy.subTitle', { maxCount: AvailableStrategies.length })}{' '}
                  <Link
                    rel="noreferrer"
                    color={Color.BLUE_400}
                    target="_blank"
                    href={DOCUMENT_URL}
                    font={{ size: 'small' }}
                  >
                    {getString('pipeline.loopingStrategy.learnMore')}
                  </Link>
                </Text>
                <Container>
                  <Layout.Horizontal
                    padding={{ top: 'large' }}
                    border={{ top: true, color: Color.GREY_200 }}
                    spacing={'medium'}
                  >
                    {getAllStrategies(formikProps.values).map(item => (
                      <Card
                        key={item.value}
                        interactive={!item.disabled}
                        className={cx(css.strategyAnchor, {
                          [css.disabled]: item.disabled,
                          [css.selected]: item.selected
                        })}
                        selected={item.selected}
                        cornerSelected={item.selected}
                        onClick={item.disabled ? noop : () => changeStrategy(item.value, formikProps)}
                      >
                        <Text font={{ variation: FontVariation.BODY }} color={Color.PRIMARY_7}>
                          {item.label}
                        </Text>
                      </Card>
                    ))}
                  </Layout.Horizontal>
                </Container>
                {selectedStrategyMetaData && (
                  <Container border={{ radius: 4 }} padding={'medium'}>
                    <Layout.Vertical spacing={'medium'}>
                      <Container>
                        <Layout.Horizontal flex={{ alignItems: 'center' }}>
                          <Container style={{ flexGrow: 1 }}>
                            <Layout.Vertical>
                              <Text font={{ variation: FontVariation.BODY, weight: 'semi-bold' }}>
                                {selectedStrategyMetaData.label}
                              </Text>
                              <Text color={Color.GREY_700} font={{ size: 'small' }}>
                                {getString(selectedStrategyMetaData.helperText)}{' '}
                                <Link
                                  rel="noreferrer"
                                  color={Color.BLUE_400}
                                  target="_blank"
                                  href={selectedStrategyMetaData.helperLink}
                                  font={{ size: 'small' }}
                                >
                                  {getString('learnMore')}
                                </Link>
                              </Text>
                            </Layout.Vertical>
                          </Container>
                          <Container>
                            <Button
                              variation={ButtonVariation.ICON}
                              icon={'main-trash'}
                              onClick={() => onDelete(formikProps)}
                            />
                          </Container>
                        </Layout.Horizontal>
                      </Container>
                      <Container>
                        <YAMLBuilder
                          showSnippetSection={false}
                          fileName={''}
                          entityType={'Pipelines'}
                          bind={setYamlHandler}
                          height="200px"
                          width="100%"
                          existingJSON={get(formikProps.values, selectedStrategyMetaData?.value)}
                          renderCustomHeader={renderCustomHeader}
                          yamlSanityConfig={{
                            removeEmptyObject: false,
                            removeEmptyString: false,
                            removeEmptyArray: false
                          }}
                          onChange={(isEditorDirty: boolean) =>
                            onStrategyChange(isEditorDirty, formikProps, selectedStrategyMetaData?.value)
                          }
                        />
                      </Container>
                    </Layout.Vertical>
                  </Container>
                )}
              </Layout.Vertical>
            </Container>
          </FormikForm>
        )
      }}
    </Formik>
  )
}
