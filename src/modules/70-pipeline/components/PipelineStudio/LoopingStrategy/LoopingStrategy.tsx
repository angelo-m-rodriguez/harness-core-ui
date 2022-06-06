/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
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
import { get, isEmpty, noop, set } from 'lodash-es'
import type { FormikProps } from 'formik'
import { Color, FontVariation } from '@wings-software/design-system'
import cx from 'classnames'
import type { StrategyConfig } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import {
  AvailableStrategies,
  LoopingStrategyEnum,
  Strategy
} from '@pipeline/components/PipelineStudio/LoopingStrategy/LoopingStrategyUtils'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { MonacoTextField } from '@common/components/MonacoTextField/MonacoTextField'
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
  const [isEdit, setIsEdit] = React.useState<boolean>(isEmpty(strategy))
  const { expressions } = useVariablesExpression()

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
      disabled: !isEmpty(selectedStrategy) && !isEdit && !isReadonly
    }))

  const getSelectedStrategyMetaData = (selectedStrategy: StrategyConfig): Strategy | undefined =>
    AvailableStrategies.find(item => !!get(selectedStrategy, item.value))

  const changeStrategy = (newStrategy: LoopingStrategyEnum, formikProps: FormikProps<StrategyConfig>) => {
    setIsEdit(true)
    const newValues: StrategyConfig = set({}, newStrategy, {})
    formikProps.setValues(newValues)
  }

  const enableEditing = React.useCallback(() => {
    setIsEdit(true)
  }, [setIsEdit])

  const onCancelEditing = React.useCallback(
    (formikProps: FormikProps<StrategyConfig>) => {
      setIsEdit(false)
      formikProps.setValues(strategy)
    },
    [setIsEdit]
  )

  const onDelete = React.useCallback(
    (formikProps: FormikProps<StrategyConfig>) => {
      formikProps.setValues({})
      onUpdateStrategy({})
    },
    [onUpdateStrategy]
  )

  const onSubmit = React.useCallback(
    (values: StrategyConfig) => {
      setIsEdit(false)
      onUpdateStrategy(values)
    },
    [onUpdateStrategy]
  )

  return (
    <Formik initialValues={strategy} formName="loopingStrategy" onSubmit={onSubmit}>
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
                            <Layout.Horizontal>
                              {!isEdit && (
                                <Button variation={ButtonVariation.ICON} icon={'edit'} onClick={enableEditing} />
                              )}
                              <Button
                                variation={ButtonVariation.ICON}
                                icon={'main-trash'}
                                onClick={() => onDelete(formikProps)}
                              />
                            </Layout.Horizontal>
                          </Container>
                        </Layout.Horizontal>
                      </Container>
                      <Container>
                        <MonacoTextField name={'random'} expressions={expressions} disabled={isReadonly} />
                      </Container>
                    </Layout.Vertical>
                  </Container>
                )}
                {isEdit && selectedStrategyMetaData && (
                  <Container>
                    <Layout.Horizontal spacing="xlarge">
                      <Button intent="primary" type="submit" text={getString('filters.apply')} />
                      <Button text={getString('cancel')} onClick={() => onCancelEditing(formikProps)} />
                    </Layout.Horizontal>
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
