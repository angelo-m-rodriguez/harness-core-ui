/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FormEvent } from 'react'
import {
  Text,
  Formik,
  getMultiTypeFromValue,
  MultiTypeInputType,
  FormikForm,
  Accordion,
  RadioButtonGroup,
  CodeBlock,
  Container,
  Layout,
  SelectOption
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { FormikProps } from 'formik'
import get from 'lodash/get'
import cx from 'classnames'
import { StepFormikFowardRef, setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { ShellScriptMonacoField } from '@common/components/ShellScriptMonaco/ShellScriptMonaco'
import { MultiTypeSelectField } from '@common/components/MultiTypeSelect/MultiTypeSelect'
import MultiTypeList, { ConnectorReferenceProps } from '@common/components/MultiTypeList/MultiTypeList'
import { FormMultiTypeCheckboxField } from '@common/components'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useStrings, UseStringsReturn } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import StepCommonFields, {
  GetImagePullPolicyOptions,
  GetShellOptions /*,{ /*usePullOptions }*/
} from '@ci/components/PipelineSteps/StepCommonFields/StepCommonFields'
import { validate } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import {
  getInitialValuesInCorrectFormat,
  getFormValuesInCorrectFormat
} from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import type { RunTestsStepProps, RunTestsStepData, RunTestsStepDataUI } from './RunTestsStep'
import { transformValuesFieldsConfig, getEditViewValidateFieldsConfig } from './RunTestsStepFunctionConfigs'
import { CIStepOptionalConfig, getOptionalSubLabel } from '../CIStep/CIStepOptionalConfig'
import {
  AllMultiTypeInputTypesForStep,
  useGetPropagatedStageById,
  validateConnectorRefAndImageDepdendency,
  SupportedInputTypesForListItems
} from '../CIStep/StepUtils'
import { CIStep } from '../CIStep/CIStep'
import { ConnectorRefWithImage } from '../CIStep/ConnectorRefWithImage'
import { CIBuildInfrastructureType } from '../../../constants/Constants'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface FieldRenderProps {
  name: string
  fieldLabelKey: keyof StringsMap
  tooltipId: string
  allowableTypes: MultiTypeInputType[]
  placeholder?: string
  renderOptionalSublabel?: boolean
  selectFieldOptions?: SelectOption[]
  onSelectChange?: (SelectOption: any) => void
  disabled?: boolean
}

const qaLocation = 'https://qa.harness.io'

enum ErrorTrackingStatus {
  ON = 'on',
  OFF = 'off'
}

const BuildTool = {
  BAZEL: 'Bazel',
  MAVEN: 'Maven',
  GRADLE: 'Gradle',
  DOTNET: 'Dotnet',
  NUNITCONSOLE: 'Nunitconsole'
}

const ET_COMMANDS_START = '#ET-SETUP-BEGIN'
const ET_COMMANDS_END = '#ET-SETUP-END'
const ET_COMMANDS =
  ET_COMMANDS_START +
  '\n' +
  'PROJ_DIR=$PWD\n' +
  'cd /opt\n' +
  'arch=`uname -m`\n' +
  'if [ $arch = "x86_64" ]; then\n' +
  '  wget -qO- https://get.et.harness.io/releases/latest/nix/harness-et-agent.tar.gz | tar -xz\n' +
  'elif [ $arch = "aarch64" ]; then\n' +
  '  wget -qO- https://get.et.harness.io/releases/latest/arm/harness-et-agent.tar.gz | tar -xz\n' +
  'fi\n' +
  'export ET_COLLECTOR_URL=https://app.harness.io/gratis/et-collector\n' +
  'export ET_APPLICATION_NAME=$HARNESS_PIPELINE_ID\n' +
  'export ET_ENV_ID=_INTERNAL_ET_CI\n' +
  'export ET_DEPLOYMENT_NAME=$HARNESS_BUILD_ID\n' +
  'export ET_ACCOUNT_ID=$HARNESS_ACCOUNT_ID\n' +
  'export ET_ORG_ID=$HARNESS_ORG_ID\n' +
  'export ET_PROJECT_ID=$HARNESS_PROJECT_ID\n' +
  '#export ET_SHUTDOWN_GRACETIME=30000\n' +
  'export JAVA_TOOL_OPTIONS="-agentpath:/opt/harness/lib/libETAgent.so"\n' +
  'cd $PROJ_DIR\n' +
  ET_COMMANDS_END

interface RadioButtonOption {
  label: string
  value: string
}
const getJavaBuildToolOptions = (getString: UseStringsReturn['getString']): SelectOption[] => [
  { label: getString('ci.runTestsStep.bazel'), value: BuildTool.BAZEL },
  { label: getString('ci.runTestsStep.maven'), value: BuildTool.MAVEN },
  { label: getString('ci.runTestsStep.gradle'), value: BuildTool.GRADLE }
]

export const getBuildEnvironmentOptions = (getString: UseStringsReturn['getString']): SelectOption[] => [
  { label: getString('ci.runTestsStep.dotNetCore'), value: 'Core' }
]

export const getFrameworkVersionOptions = (getString: UseStringsReturn['getString']): SelectOption[] => [
  { label: getString('ci.runTestsStep.sixPointZero'), value: '6.0' },
  { label: getString('ci.runTestsStep.fivePointZero'), value: '5.0' }
]

export const getCSharpBuildToolOptions = (getString: UseStringsReturn['getString']): SelectOption[] => [
  { label: getString('ci.runTestsStep.dotnet'), value: BuildTool.DOTNET },
  { label: getString('ci.runTestsStep.nUnitConsole'), value: BuildTool.NUNITCONSOLE }
]

export const getErrorTrackingOptions = (getString: UseStringsReturn['getString']): Array<RadioButtonOption> => [
  { label: getString('yes'), value: ErrorTrackingStatus.ON },
  { label: getString('no'), value: ErrorTrackingStatus.OFF }
]

const enum Language {
  Java = 'Java',
  Csharp = 'Csharp'
}

const getLanguageOptions = (getString: UseStringsReturn['getString']): SelectOption[] => [
  { label: getString('ci.runTestsStep.csharp'), value: Language.Csharp },
  { label: getString('ci.runTestsStep.java'), value: Language.Java }
]

const getBuildToolOptions = (
  getString: UseStringsReturn['getString'],
  language?: string
): SelectOption[] | undefined => {
  if (language === Language.Java) {
    return getJavaBuildToolOptions(getString)
  } else if (language === Language.Csharp) {
    return getCSharpBuildToolOptions(getString)
  }
  return undefined
}

const getArgsPlaceholder = (buildTool?: string): string => {
  if (buildTool === BuildTool.MAVEN || buildTool === BuildTool.GRADLE) {
    return 'clean test'
  } else if (buildTool === BuildTool.BAZEL) {
    return 'test'
  } else if (buildTool === BuildTool.DOTNET) {
    return '/path/to/test.dll /path/to/testProject.dll'
  } else if (buildTool === BuildTool.NUNITCONSOLE) {
    return '. "path/to/nunit3-console.exe" path/to/TestProject.dll --result="UnitTestResults.xml"'
  }
  return ''
}

const getUpdatedPreCommand = (preCommand: string, isErrorTrackingOn: boolean): string => {
  let updatedCommand = preCommand
  if (
    isErrorTrackingOn &&
    (!preCommand || (preCommand.indexOf(ET_COMMANDS_START) < 0 && preCommand.indexOf(ET_COMMANDS_END) < 0))
  ) {
    updatedCommand = ET_COMMANDS + '\n' + (preCommand ? preCommand : '')
  } else if (
    !isErrorTrackingOn &&
    preCommand.indexOf(ET_COMMANDS_START) >= 0 &&
    preCommand.indexOf(ET_COMMANDS_END) >= 0
  ) {
    updatedCommand = ''
    const startIndex = preCommand.indexOf(ET_COMMANDS_START)
    let endIndex = preCommand.indexOf(ET_COMMANDS_END)
    if (startIndex >= 0 && endIndex >= 0) {
      if (startIndex > 0) {
        updatedCommand = preCommand.substring(0, startIndex)
      }
      endIndex += ET_COMMANDS_END.length
      if (endIndex < preCommand.length && preCommand.charAt(endIndex) === '\n') {
        endIndex++
      }
      if (endIndex < preCommand.length - 1) {
        updatedCommand = updatedCommand + preCommand.substring(endIndex)
      }
    }
  }
  return updatedCommand
}

export const RunTestsStepBase = (
  { initialValues, onUpdate, isNewStep = true, readonly, stepViewType, onChange }: RunTestsStepProps,
  formikRef: StepFormikFowardRef<RunTestsStepData>
): JSX.Element => {
  const {
    state: {
      selectionState: { selectedStageId }
    }
  } = usePipelineContext()
  const { TI_DOTNET, ERROR_TRACKING_ENABLED } = useFeatureFlags()
  // temporary enable in QA for docs
  const isQAEnvironment = window.location.origin === qaLocation
  const [mavenSetupQuestionAnswer, setMavenSetupQuestionAnswer] = React.useState('yes')
  const currentStage = useGetPropagatedStageById(selectedStageId || '')
  const buildInfrastructureType: CIBuildInfrastructureType = get(currentStage, 'stage.spec.infrastructure.type')
  const { getString } = useStrings()
  const [buildToolOptions, setBuildToolOptions] = React.useState<SelectOption[]>(
    getBuildToolOptions(getString, initialValues?.spec?.language) || []
  )
  const { expressions } = useVariablesExpression()

  // TODO: Right now we do not support Image Pull Policy but will do in the future
  // const pullOptions = usePullOptions()

  // TODO: Right now we do not support Image Pull Policy but will do in the future
  // const values = getInitialValuesInCorrectFormat<RunTestsStepData, RunTestsStepDataUI>(initialValues, transformValuesFieldsConfig, {
  //   pullOptions
  // })

  const renderMultiTypeTextField = React.useCallback(
    ({
      name,
      fieldLabelKey,
      tooltipId,
      allowableTypes,
      renderOptionalSublabel = false,
      placeholder
    }: FieldRenderProps) => {
      return (
        <MultiTypeTextField
          name={name}
          label={
            <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={renderOptionalSublabel ? {} : { dataTooltipId: tooltipId }}
              >
                {getString(fieldLabelKey)}
              </Text>
              {renderOptionalSublabel ? (
                <>
                  &nbsp;
                  {getOptionalSubLabel(getString, tooltipId)}
                </>
              ) : null}
            </Layout.Horizontal>
          }
          multiTextInputProps={{
            multiTextInputProps: { expressions, allowableTypes },
            disabled: readonly,
            placeholder: placeholder
          }}
          style={{ marginBottom: 'var(--spacing-small)' }}
        />
      )
    },
    []
  )

  const renderMultiTypeSelectField = React.useCallback(
    ({
      name,
      fieldLabelKey,
      tooltipId,
      selectFieldOptions = [],
      renderOptionalSublabel = false,
      onSelectChange,
      allowableTypes
    }: FieldRenderProps) => {
      return (
        <MultiTypeSelectField
          name={name}
          label={
            <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={renderOptionalSublabel ? {} : { dataTooltipId: tooltipId }}
              >
                {getString(fieldLabelKey)}
              </Text>
              {renderOptionalSublabel ? (
                <>
                  &nbsp;
                  {getOptionalSubLabel(getString, tooltipId)}
                </>
              ) : null}
            </Layout.Horizontal>
          }
          multiTypeInputProps={{
            selectItems: selectFieldOptions,
            multiTypeInputProps: {
              onChange: option => onSelectChange?.(option),
              allowableTypes: allowableTypes,
              expressions
            },
            disabled: readonly
          }}
          disabled={readonly}
        />
      )
    },
    []
  )

  const renderMultiTypeFieldSelector = React.useCallback(
    ({ name, fieldLabelKey, tooltipId, allowableTypes }: FieldRenderProps) => {
      return (
        <MultiTypeFieldSelector
          name={name}
          label={
            <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {getString(fieldLabelKey)}
              </Text>
              &nbsp;
              {getOptionalSubLabel(getString, tooltipId)}
            </Layout.Horizontal>
          }
          defaultValueToReset=""
          allowedTypes={allowableTypes}
          expressionRender={() => {
            return (
              <ShellScriptMonacoField name={name} scriptType="Bash" disabled={readonly} expressions={expressions} />
            )
          }}
          style={{ flexGrow: 1, marginBottom: 0 }}
          disableTypeSelection={readonly}
        >
          <ShellScriptMonacoField
            className={css.shellScriptMonacoField}
            name={name}
            scriptType="Bash"
            disabled={readonly}
          />
        </MultiTypeFieldSelector>
      )
    },
    []
  )

  const renderMultiTypeList = React.useCallback(
    ({
      name,
      tooltipId,
      labelKey,
      placeholderKey,
      allowedTypes,
      allowedTypesForEntries,
      showConnectorRef,
      connectorTypes,
      connectorRefRenderer,
      restrictToSingleEntry
    }: {
      name: string
      tooltipId?: string
      labelKey: keyof StringsMap
      placeholderKey?: keyof StringsMap
      allowedTypes: MultiTypeInputType[]
      allowedTypesForEntries: MultiTypeInputType[]
      restrictToSingleEntry?: boolean
    } & ConnectorReferenceProps) => (
      <MultiTypeList
        name={name}
        placeholder={placeholderKey ? getString(placeholderKey) : ''}
        multiTextInputProps={{
          expressions,
          allowableTypes: allowedTypesForEntries
        }}
        multiTypeFieldSelectorProps={{
          label: (
            <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
              <Text
                tooltipProps={tooltipId ? { dataTooltipId: tooltipId } : {}}
                style={{ display: 'flex', alignItems: 'center' }}
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
              >
                {getString(labelKey)}
              </Text>
            </Layout.Horizontal>
          ),
          allowedTypes: allowedTypes
        }}
        disabled={readonly}
        showConnectorRef={showConnectorRef}
        connectorTypes={connectorTypes}
        connectorRefRenderer={connectorRefRenderer}
        restrictToSingleEntry={restrictToSingleEntry}
      />
    ),
    [expressions]
  )

  return (
    <Formik
      initialValues={getInitialValuesInCorrectFormat<RunTestsStepData, RunTestsStepDataUI>(
        initialValues,
        transformValuesFieldsConfig,
        {
          buildToolOptions,
          languageOptions: getLanguageOptions(getString),
          imagePullPolicyOptions: GetImagePullPolicyOptions(),
          shellOptions: GetShellOptions(getString),
          buildEnvironmentOptions: getBuildEnvironmentOptions(getString),
          frameworkVersionOptions: getFrameworkVersionOptions(getString)
        }
      )}
      formName="ciRunTests"
      validate={valuesToValidate => {
        if (buildInfrastructureType === CIBuildInfrastructureType.VM) {
          return validateConnectorRefAndImageDepdendency(
            get(valuesToValidate, 'spec.connectorRef', ''),
            get(valuesToValidate, 'spec.image', ''),
            getString
          )
        }
        const schemaValues = getFormValuesInCorrectFormat<RunTestsStepDataUI, RunTestsStepData>(
          valuesToValidate,
          transformValuesFieldsConfig
        )
        onChange?.(schemaValues)
        return validate(
          valuesToValidate,
          getEditViewValidateFieldsConfig(
            buildInfrastructureType,
            (valuesToValidate?.spec?.language as any)?.value === Language.Csharp
          ),
          {
            initialValues,
            steps: currentStage?.stage?.spec?.execution?.steps || {},
            serviceDependencies: currentStage?.stage?.spec?.serviceDependencies || {},
            getString
          },
          stepViewType
        )
      }}
      onSubmit={(_values: RunTestsStepDataUI) => {
        const schemaValues = getFormValuesInCorrectFormat<RunTestsStepDataUI, RunTestsStepData>(
          _values,
          transformValuesFieldsConfig
        )
        onUpdate?.(schemaValues)
      }}
    >
      {(formik: FormikProps<RunTestsStepData>) => {
        // This is required
        setFormikRef?.(formikRef, formik)
        const selectedLanguageValue = (formik.values?.spec?.language as any)?.value
        const buildTool = (formik.values?.spec?.buildTool as any)?.value
        const isErrorTrackingCurrentlyOn =
          selectedLanguageValue === Language.Java &&
          formik?.values?.spec?.preCommand &&
          formik.values.spec.preCommand.indexOf(ET_COMMANDS_START) >= 0 &&
          formik.values.spec.preCommand.indexOf(ET_COMMANDS_END) >= 0

        return (
          <FormikForm>
            <CIStep
              isNewStep={isNewStep}
              readonly={readonly}
              stepViewType={stepViewType}
              formik={formik}
              enableFields={{
                name: {},
                description: {}
              }}
            />
            {buildInfrastructureType !== CIBuildInfrastructureType.VM ? (
              <ConnectorRefWithImage showOptionalSublabel={false} readonly={readonly} stepViewType={stepViewType} />
            ) : null}
            <Container className={cx(css.formGroup, css.lg, css.bottomMargin5)}>
              {renderMultiTypeSelectField({
                name: 'spec.language',
                fieldLabelKey: 'languageLabel',
                tooltipId: 'runTestsLanguage',
                selectFieldOptions:
                  isQAEnvironment || TI_DOTNET
                    ? getLanguageOptions(getString)
                    : getLanguageOptions(getString).slice(1, 2),
                onSelectChange: option => {
                  const newBuildToolOptions = getBuildToolOptions(getString, option?.value as string)
                  const newValues = { ...formik.values }
                  if (newBuildToolOptions) {
                    setBuildToolOptions(newBuildToolOptions)
                  }
                  if (option) {
                    // reset downstream values if language changed
                    newValues.spec.language = option
                    newValues.spec.testAnnotations = undefined
                    newValues.spec.buildEnvironment = undefined
                    newValues.spec.frameworkVersion = undefined
                    newValues.spec.packages = undefined
                    newValues.spec.namespaces = undefined
                    newValues.spec.buildTool = ''
                    newValues.spec.args = ''
                    formik.setValues({ ...newValues })
                  }
                },
                allowableTypes: [MultiTypeInputType.FIXED]
              })}
            </Container>
            {ERROR_TRACKING_ENABLED && selectedLanguageValue === Language.Java && (
              <>
                <Text tooltipProps={{ dataTooltipId: 'runTestErrorTracking' }} font={{ size: 'small' }}>
                  {getString('ci.runTestsErrorTrackingSetupText')}
                </Text>
                <RadioButtonGroup
                  name="error-tracking-setup"
                  inline={true}
                  selectedValue={isErrorTrackingCurrentlyOn ? ErrorTrackingStatus.ON : ErrorTrackingStatus.OFF}
                  onChange={(e: FormEvent<HTMLInputElement>) => {
                    const preCommand = formik?.values?.spec?.preCommand as string
                    const turnErrorTrackingOn = e.currentTarget.value === ErrorTrackingStatus.ON
                    formik?.setFieldValue('spec.preCommand', getUpdatedPreCommand(preCommand, turnErrorTrackingOn))
                  }}
                  options={getErrorTrackingOptions(getString)}
                  margin={{ bottom: 'small' }}
                />
              </>
            )}
            {selectedLanguageValue === Language.Csharp && (
              <>
                <Container className={cx(css.formGroup, css.lg, css.bottomMargin5)}>
                  {renderMultiTypeSelectField({
                    name: 'spec.buildEnvironment',
                    fieldLabelKey: 'ci.runTestsStep.buildEnvironment',
                    tooltipId: 'buildEnvironment',
                    selectFieldOptions: getBuildEnvironmentOptions(getString),
                    allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
                  })}
                </Container>
                <Container className={cx(css.formGroup, css.lg, css.bottomMargin5)}>
                  {renderMultiTypeSelectField({
                    name: 'spec.frameworkVersion',
                    fieldLabelKey: 'ci.runTestsStep.frameworkVersion',
                    tooltipId: 'frameworkVersion',
                    selectFieldOptions: getFrameworkVersionOptions(getString),
                    allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
                  })}
                </Container>
              </>
            )}
            <Container className={cx(css.formGroup, css.lg, css.bottomMargin5)}>
              {renderMultiTypeSelectField({
                name: 'spec.buildTool',
                fieldLabelKey: 'buildToolLabel',
                tooltipId: 'runTestsBuildTool',
                selectFieldOptions: buildToolOptions,
                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
              })}
            </Container>
            {(formik.values?.spec?.language as any)?.value === Language.Java && buildTool === BuildTool.MAVEN && (
              <>
                <Text margin={{ top: 'small', bottom: 'small' }} color="grey800">
                  {getString('ci.runTestsMavenSetupTitle')}
                </Text>
                <Text font={{ size: 'small' }}>{getString('ci.runTestsMavenSetupText1')}</Text>
                <RadioButtonGroup
                  name="run-tests-maven-setup"
                  inline={true}
                  selectedValue={mavenSetupQuestionAnswer}
                  onChange={(e: FormEvent<HTMLInputElement>) => {
                    setMavenSetupQuestionAnswer(e.currentTarget.value)
                  }}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' }
                  ]}
                  margin={{ bottom: 'small' }}
                />
                {mavenSetupQuestionAnswer === 'yes' && (
                  <Container className={cx(css.bottomMargin5)}>
                    <Text
                      font={{ size: 'small' }}
                      margin={{ bottom: 'xsmall' }}
                      tooltipProps={{ dataTooltipId: 'runTestsMavenSetupText2' }}
                    >
                      {getString('ci.runTestsMavenSetupText2')}
                    </Text>
                    <CodeBlock format="pre" snippet={getString('ci.runTestsMavenSetupSample')} />
                  </Container>
                )}
              </>
            )}
            {(formik.values?.spec?.language as any)?.value === Language.Java && buildTool === BuildTool.GRADLE && (
              <>
                <Text margin={{ top: 'small', bottom: 'small' }} color="grey800">
                  {getString('ci.gradleNotesTitle')}
                </Text>
                <CodeBlock
                  allowCopy
                  codeToCopy={`tasks.withType(Test) {
  if(System.getProperty("HARNESS_JAVA_AGENT")) {
    jvmArgs += [System.getProperty("HARNESS_JAVA_AGENT")]
  }
}

gradle.projectsEvaluated {
        tasks.withType(Test) {
            filter {
                setFailOnNoMatchingTests(false)
            }
        }
}`}
                  format="pre"
                  snippet={getString('ci.gradleNote1')}
                />
                <Text margin={{ top: 'small', bottom: 'medium' }} color="grey800">
                  {getString('ci.gradleNote2')}
                </Text>
              </>
            )}
            {buildTool && (
              <Container className={cx(css.formGroup, css.lg)}>
                {renderMultiTypeTextField({
                  name: 'spec.args',
                  fieldLabelKey: 'pipelineSteps.buildArgsLabel',
                  tooltipId: 'runTestsArgs',
                  placeholder: getArgsPlaceholder(buildTool),
                  allowableTypes: AllMultiTypeInputTypesForStep
                })}
              </Container>
            )}
            {selectedLanguageValue === Language.Java && (
              <Container className={cx(css.formGroup, css.lg)}>
                {renderMultiTypeTextField({
                  name: 'spec.packages',
                  fieldLabelKey: 'packagesLabel',
                  tooltipId: 'runTestsPackages',
                  renderOptionalSublabel: true,
                  allowableTypes: AllMultiTypeInputTypesForStep
                })}
              </Container>
            )}
            {selectedLanguageValue === Language.Csharp && (
              <Container className={cx(css.formGroup, css.lg)}>
                {renderMultiTypeTextField({
                  name: 'spec.namespaces',
                  fieldLabelKey: 'ci.runTestsStep.namespaces',
                  tooltipId: 'runTestsNamespaces',
                  allowableTypes: AllMultiTypeInputTypesForStep
                })}
              </Container>
            )}
            <Container className={css.bottomMargin5}>
              {renderMultiTypeList({
                name: 'spec.reportPaths',
                placeholderKey: 'pipelineSteps.reportPathsPlaceholder',
                labelKey: 'ci.runTestsStep.testReportPaths',
                allowedTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME],
                allowedTypesForEntries: SupportedInputTypesForListItems
              })}
            </Container>
            <Container className={css.bottomMargin5}>
              <div className={cx(css.fieldsGroup, css.withoutSpacing)} style={{ marginBottom: 'var(--spacing-small)' }}>
                {renderMultiTypeFieldSelector({
                  name: 'spec.preCommand',
                  fieldLabelKey: 'ci.preCommandLabel',
                  tooltipId: '',
                  allowableTypes: AllMultiTypeInputTypesForStep
                })}
                {getMultiTypeFromValue(formik?.values?.spec?.preCommand) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    style={{ marginTop: 17 }}
                    value={formik?.values?.spec?.preCommand as string}
                    type={getString('string')}
                    variableName="spec.preCommand"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => formik?.setFieldValue('spec.preCommand', value)}
                    isReadonly={readonly}
                  />
                )}
              </div>
            </Container>
            <Container className={css.bottomMargin5}>
              <div className={cx(css.fieldsGroup, css.withoutSpacing)} style={{ marginBottom: 'var(--spacing-small)' }}>
                {renderMultiTypeFieldSelector({
                  name: 'spec.postCommand',
                  fieldLabelKey: 'ci.postCommandLabel',
                  tooltipId: '',
                  allowableTypes: AllMultiTypeInputTypesForStep
                })}
                {getMultiTypeFromValue(formik?.values?.spec?.postCommand) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    style={{ marginTop: 17 }}
                    value={formik?.values?.spec?.postCommand as string}
                    type={getString('string')}
                    variableName="spec.postCommand"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => formik?.setFieldValue('spec.postCommand', value)}
                    isReadonly={readonly}
                  />
                )}
              </div>
            </Container>
            <Accordion className={css.accordion}>
              <Accordion.Panel
                id="optional-config"
                summary={getString('pipeline.additionalConfiguration')}
                details={
                  <Container margin={{ top: 'medium' }}>
                    {buildInfrastructureType === CIBuildInfrastructureType.VM ? (
                      <ConnectorRefWithImage
                        showOptionalSublabel={true}
                        readonly={readonly}
                        stepViewType={stepViewType}
                      />
                    ) : null}
                    <Container className={cx(css.formGroup, css.sm, css.bottomMargin5)}>
                      <FormMultiTypeCheckboxField
                        name="spec.runOnlySelectedTests"
                        label={getString('runOnlySelectedTestsLabel')}
                        multiTypeTextbox={{
                          expressions,
                          disabled: readonly,
                          allowableTypes: AllMultiTypeInputTypesForStep
                        }}
                        style={{ marginBottom: 'var(--spacing-small)' }}
                        disabled={readonly}
                      />
                    </Container>
                    {selectedLanguageValue === Language.Java && (
                      <Container className={cx(css.formGroup, css.lg, css.bottomMargin5)}>
                        {renderMultiTypeTextField({
                          name: 'spec.testAnnotations',
                          fieldLabelKey: 'testAnnotationsLabel',
                          tooltipId: '',
                          renderOptionalSublabel: true,
                          allowableTypes: AllMultiTypeInputTypesForStep
                        })}
                      </Container>
                    )}
                    <CIStepOptionalConfig
                      stepViewType={stepViewType}
                      readonly={readonly}
                      enableFields={{
                        'spec.envVariables': { tooltipId: 'environmentVariables' },
                        'spec.outputVariables': {}
                      }}
                    />
                    <StepCommonFields
                      enableFields={['spec.shell', 'spec.imagePullPolicy']}
                      disabled={readonly}
                      buildInfrastructureType={buildInfrastructureType}
                    />
                  </Container>
                }
              />
            </Accordion>
          </FormikForm>
        )
      }}
    </Formik>
  )
}

export const RunTestsStepBaseWithRef = React.forwardRef(RunTestsStepBase)
