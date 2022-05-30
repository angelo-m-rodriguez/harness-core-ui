/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, createRef, RefObject } from 'react'
import {
  Layout,
  Tabs,
  Tab,
  Formik,
  FormikForm,
  Icon,
  VisualYamlSelectedView as SelectedView
} from '@wings-software/uicore'
import type { IconName } from '@wings-software/uicore'
import { useHistory } from 'react-router-dom'
import cx from 'classnames'
import { isEqual, noop } from 'lodash-es'
import { NavigationCheck } from '@common/components/NavigationCheck/NavigationCheck'
import { useToaster } from '@common/exports'
import type {
  YamlBuilderHandlerBinding,
  YamlBuilderProps,
  InvocationMapFunction
} from '@common/interfaces/YAMLBuilderProps'
import {
  renderTitle,
  setNewTouchedPanel,
  shouldBlockNavigation,
  renderYamlBuilder,
  FormikPropsInterface
} from './WizardUtils'
import { FormikEffect, FormikEffectProps } from '../FormikEffect/FormikEffect'
import { WizardHeader } from './WizardHeader'
import { WizardFooter } from './WizardFooter'
import css from './Wizard.module.scss'

export interface PanelInterface {
  id: string
  tabTitle?: string
  tabTitleComponent?: JSX.Element
  iconName?: IconName
  requiredFields?: string[]
  checkValidPanel?: ({
    formikValues,
    formikErrors
  }: {
    formikValues: { [key: string]: any }
    formikErrors: { [key: string]: any }
  }) => boolean
}
export interface WizardMapInterface {
  wizardLabel?: string
  panels: PanelInterface[]
}

interface VisualYamlPropsInterface {
  showVisualYaml: boolean
  schema?: Record<string, any>
  invocationMap?: Map<RegExp, InvocationMapFunction>
  handleModeSwitch: (mode: SelectedView, yamlHandler?: YamlBuilderHandlerBinding) => void
  convertFormikValuesToYaml: (formikPropsValues: any) => any
  onYamlSubmit: (val: any) => void
  yamlObjectKey?: string
  loading?: boolean
  yamlBuilderReadOnlyModeProps: YamlBuilderProps
  positionInHeader?: boolean
}
interface WizardProps {
  wizardMap: WizardMapInterface
  formikInitialProps: FormikPropsInterface
  onHide: () => void
  defaultTabId?: string
  tabWidth?: string
  tabChevronOffset?: string
  submitLabel?: string
  isEdit?: boolean
  children?: JSX.Element[]
  disableSubmit?: boolean
  errorToasterMessage?: string
  rightNav?: JSX.Element
  leftNav?: ({ selectedView }: { selectedView: SelectedView }) => JSX.Element
  visualYamlProps?: VisualYamlPropsInterface
  wizardType?: string // required for dataTooltip to be unique
  className?: string
  renderErrorsStrip?: () => JSX.Element // component currently only allowed for pipeline components
  onFormikEffect?: FormikEffectProps['onChange']
}

const Wizard: React.FC<WizardProps> = ({
  wizardMap,
  onHide,
  submitLabel,
  tabWidth,
  tabChevronOffset,
  defaultTabId,
  formikInitialProps,
  children,
  isEdit = false,
  disableSubmit,
  errorToasterMessage,
  rightNav,
  leftNav,
  visualYamlProps = { showVisualYaml: false },
  className = '',
  wizardType,
  renderErrorsStrip,
  onFormikEffect = noop
}) => {
  const { wizardLabel } = wizardMap
  const defaultWizardTabId = wizardMap.panels[0].id
  const tabsMap = wizardMap?.panels?.map(panel => panel.id)
  const initialIndex = defaultTabId ? tabsMap.findIndex(tabsId => defaultTabId === tabsId) : 0
  const [selectedTabId, setSelectedTabId] = React.useState<string>(defaultTabId || defaultWizardTabId)
  const [touchedPanels, setTouchedPanels] = React.useState<number[]>([])
  const [validateOnChange, setValidateOnChange] = React.useState<boolean>(formikInitialProps.validateOnChange || false)
  const [selectedTabIndex, setSelectedTabIndex] = React.useState<number>(initialIndex)
  const [selectedView, setSelectedView] = React.useState<SelectedView>(SelectedView.VISUAL)
  const layoutRef = useRef<HTMLDivElement>(null)
  const lastTab = selectedTabIndex === tabsMap.length - 1
  const {
    showVisualYaml,
    handleModeSwitch,
    yamlBuilderReadOnlyModeProps,
    loading: loadingYamlView,
    schema,
    convertFormikValuesToYaml,
    onYamlSubmit,
    yamlObjectKey,
    invocationMap,
    positionInHeader
  } = visualYamlProps
  const isYamlView = selectedView === SelectedView.YAML
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const elementsRef: { current: RefObject<HTMLSpanElement>[] } = useRef(wizardMap.panels?.map(() => createRef()))
  const [submittedForm, setSubmittedForm] = React.useState<boolean>(false)

  const handleTabChange = (data: string): void => {
    const tabsIndex = tabsMap.findIndex(tab => tab === data)
    setSelectedTabId(data)
    setSelectedTabIndex(tabsIndex)
    setNewTouchedPanel({
      upcomingTabIndex: tabsIndex,
      selectedTabIndex,
      touchedPanels,
      setTouchedPanels,
      includeSkippedIndexes: true
    })
  }
  const history = useHistory()
  const { showError, clear } = useToaster()
  const getIsDirtyForm = (parsedYaml: any): boolean =>
    !isEqual(convertFormikValuesToYaml?.(formikInitialProps?.initialValues), parsedYaml)

  useEffect(() => {
    if (errorToasterMessage) {
      showError(errorToasterMessage)
    } else {
      clear()
    }
  }, [showError, errorToasterMessage])

  return (
    <section className={cx(css.wizardShell, className)} ref={layoutRef}>
      <WizardHeader
        yamlHandler={yamlHandler}
        showError={showError}
        leftNav={leftNav}
        selectedView={selectedView}
        rightNav={rightNav}
        showVisualYaml={showVisualYaml}
        handleModeSwitch={handleModeSwitch}
        setSelectedView={setSelectedView}
        positionInHeader={positionInHeader}
        wizardLabel={wizardLabel}
      />
      {submittedForm && renderErrorsStrip?.()}
      <Layout.Horizontal spacing="large" className={css.tabsContainer}>
        <Formik
          {...formikInitialProps}
          validateOnChange={validateOnChange}
          formName={`wizardForm${wizardType ? `_${wizardType}` : ''}`}
        >
          {formikProps => {
            const additionalWizardFooterProps =
              typeof formikInitialProps.validate !== 'undefined'
                ? {
                    validate: (arg?: { latestYaml?: string }) =>
                      formikInitialProps?.validate?.({ formikProps, latestYaml: arg?.latestYaml })
                  }
                : {}

            return (
              <FormikForm className={isYamlView ? css.yamlContainer : ''}>
                <FormikEffect onChange={onFormikEffect} formik={formikProps} />
                <NavigationCheck
                  when={true}
                  shouldBlockNavigation={() =>
                    shouldBlockNavigation({
                      isSubmitting: formikProps.isSubmitting,
                      isValid: formikProps.isValid,
                      isYamlView,
                      yamlHandler,
                      dirty: formikProps.dirty,
                      getIsDirtyForm
                    })
                  }
                  navigate={newPath => {
                    history.push(newPath)
                  }}
                />
                {isYamlView && yamlBuilderReadOnlyModeProps ? (
                  // loadingYamlView ?
                  renderYamlBuilder({
                    loadingYamlView,
                    yamlBuilderReadOnlyModeProps,
                    convertFormikValuesToYaml,
                    formikProps,
                    setYamlHandler,
                    invocationMap,
                    schema
                  })
                ) : (
                  // (
                  //   <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
                  //     <PageSpinner />
                  //   </div>
                  // ) : (
                  //   <YAMLBuilder
                  //     {...yamlBuilderReadOnlyModeProps}
                  //     existingJSON={convertFormikValuesToYaml?.(formikProps.values)}
                  //     isReadOnlyMode={false}
                  //     showSnippetSection={false}
                  //     bind={setYamlHandler}
                  //     invocationMap={invocationMap}
                  //     schema={schema}
                  //   />
                  // )
                  <Tabs id="Wizard" onChange={handleTabChange} selectedTabId={selectedTabId}>
                    {wizardMap.panels.map((_panel, panelIndex) => {
                      const { id, tabTitle, tabTitleComponent, requiredFields = [], checkValidPanel } = _panel
                      return (
                        <Tab
                          key={id}
                          id={id}
                          style={{ width: tabWidth ? tabWidth : 'auto' }}
                          title={renderTitle({
                            tabTitle,
                            tabTitleComponent,
                            requiredFields,
                            checkValidPanel,
                            panelIndex,
                            touchedPanels,
                            isEdit,
                            selectedTabIndex,
                            formikVals: formikProps.values,
                            formikErrs: formikProps.errors,
                            ref: elementsRef.current[panelIndex]
                          })}
                          panel={
                            children?.[panelIndex] && React.cloneElement(children[panelIndex], { formikProps, isEdit })
                          }
                        >
                          {panelIndex !== wizardMap.panels.length - 1 && (
                            <Icon
                              data-name="chevron-right-tab"
                              name="chevron-right"
                              height={20}
                              size={20}
                              margin={{ right: 'small', left: 'small' }}
                              color={'grey400'}
                              style={{
                                position: tabChevronOffset ? 'absolute' : 'initial',
                                left: tabChevronOffset || 'auto',
                                cursor: 'auto'
                              }}
                              onClick={e => e.preventDefault()}
                            />
                          )}
                        </Tab>
                      )
                    })}
                  </Tabs>
                )}
                <WizardFooter
                  isYamlView={isYamlView}
                  selectedTabIndex={selectedTabIndex}
                  onHide={onHide}
                  submitLabel={submitLabel}
                  disableSubmit={disableSubmit}
                  setValidateOnChange={setValidateOnChange}
                  lastTab={lastTab}
                  onYamlSubmit={onYamlSubmit}
                  yamlObjectKey={yamlObjectKey}
                  yamlHandler={yamlHandler}
                  elementsRef={elementsRef}
                  showError={showError}
                  formikProps={formikProps}
                  yamlBuilderReadOnlyModeProps={yamlBuilderReadOnlyModeProps}
                  setSelectedTabId={setSelectedTabId}
                  setSelectedTabIndex={setSelectedTabIndex}
                  tabsMap={tabsMap}
                  touchedPanels={touchedPanels}
                  setTouchedPanels={setTouchedPanels}
                  loadingYamlView={loadingYamlView}
                  setSubmittedForm={setSubmittedForm}
                  {...additionalWizardFooterProps}
                />
              </FormikForm>
            )
          }}
        </Formik>
      </Layout.Horizontal>
      <div className={css.footerLine}></div>
    </section>
  )
}

export default Wizard
