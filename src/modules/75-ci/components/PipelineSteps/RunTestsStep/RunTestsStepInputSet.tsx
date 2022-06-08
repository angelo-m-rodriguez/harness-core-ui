/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { connect } from 'formik'
import { Text, getMultiTypeFromValue, MultiTypeInputType, FormikForm, Container, Layout } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { isEmpty, startCase } from 'lodash-es'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import { ShellScriptMonacoField } from '@common/components/ShellScriptMonaco/ShellScriptMonaco'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { FormMultiTypeCheckboxField } from '@common/components'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { MultiTypeSelectField } from '@common/components/MultiTypeSelect/MultiTypeSelect'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { shouldRenderRunTimeInputViewWithAllowedValues } from '@pipeline/utils/CIUtils'
import type { RunTestsStepProps } from './RunTestsStep'
import { getBuildEnvironmentOptions, getCSharpBuildToolOptions, getFrameworkVersionOptions } from './RunTestsStepBase'
import { CIStep } from '../CIStep/CIStep'
import { ConnectorRefWithImage } from '../CIStep/ConnectorRefWithImage'
import { getOptionalSubLabel, renderMultiTypeInputWithAllowedValues } from '../CIStep/CIStepOptionalConfig'
import { RunAndRunTestStepInputCommonFields } from '../CIStep/RunAndRunTestStepInputCommonFields'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export const RunTestsStepInputSetBasic: React.FC<RunTestsStepProps> = props => {
  const { template, path, readonly, stepViewType, allowableTypes } = props
  const { getString } = useStrings()

  const { expressions } = useVariablesExpression()
  const prefix = isEmpty(path) ? '' : `${path}.`
  const stepCss = stepViewType === StepViewType.DeploymentForm ? css.sm : css.lg

  const renderCommandEditor = React.useCallback(
    (fieldName: string, stringKey: keyof StringsMap, tooltipId: string): React.ReactElement => (
      <Container className={cx(css.bottomMargin5, css.fieldsGroup, css.withoutSpacing)}>
        <MultiTypeFieldSelector
          name={fieldName}
          label={
            <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {getString(stringKey)}
              </Text>
              &nbsp;
              {getOptionalSubLabel(getString, tooltipId)}
            </Layout.Horizontal>
          }
          defaultValueToReset=""
          allowedTypes={allowableTypes}
          expressionRender={() => {
            return (
              <ShellScriptMonacoField
                title={stringKey}
                name={fieldName}
                scriptType="Bash"
                expressions={expressions}
                disabled={readonly}
              />
            )
          }}
          style={{ flexGrow: 1, marginBottom: 0 }}
          disableTypeSelection={readonly}
        >
          <ShellScriptMonacoField
            title={getString(stringKey)}
            name={fieldName}
            scriptType="Bash"
            expressions={expressions}
            disabled={readonly}
          />
        </MultiTypeFieldSelector>
      </Container>
    ),
    []
  )

  return (
    <FormikForm className={css.removeBpPopoverWrapperTopMargin}>
      <CIStep
        readonly={readonly}
        stepViewType={stepViewType}
        enableFields={{
          ...(getMultiTypeFromValue(template?.description) === MultiTypeInputType.RUNTIME && {
            description: {}
          })
        }}
        path={path || ''}
      />
      <ConnectorRefWithImage
        readonly={readonly}
        showConnectorRef={getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME}
        showImage={getMultiTypeFromValue(template?.spec?.image) === MultiTypeInputType.RUNTIME}
        stepViewType={stepViewType}
        path={path || ''}
        template={template}
        isInputSetView={true}
      />
      {getMultiTypeFromValue(template?.spec?.buildEnvironment) === MultiTypeInputType.RUNTIME && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeSelectField
            label={
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={{ dataTooltipId: 'buildEnvironment' }}
              >
                {getString('ci.runTestsStep.buildEnvironment')}
              </Text>
            }
            name={`${prefix}spec.buildEnvironment`}
            useValue
            multiTypeInputProps={{
              selectItems: getBuildEnvironmentOptions(getString),
              placeholder: getString('select'),
              multiTypeInputProps: {
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED]
              }
            }}
            disabled={readonly}
          />
        </Container>
      )}
      {getMultiTypeFromValue(template?.spec?.frameworkVersion) === MultiTypeInputType.RUNTIME && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeSelectField
            label={
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={{ dataTooltipId: 'frameworkVersion' }}
              >
                {getString('ci.runTestsStep.frameworkVersion')}
              </Text>
            }
            name={`${prefix}spec.frameworkVersion`}
            useValue
            multiTypeInputProps={{
              selectItems: getFrameworkVersionOptions(getString),
              placeholder: getString('select'),
              multiTypeInputProps: {
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED]
              }
            }}
            disabled={readonly}
          />
        </Container>
      )}
      {getMultiTypeFromValue(template?.spec?.buildTool) === MultiTypeInputType.RUNTIME && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeSelectField
            label={
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={{ dataTooltipId: 'runTestsBuildTool' }}
              >
                {getString('buildToolLabel')}
              </Text>
            }
            name={`${prefix}spec.buildTool`}
            useValue
            multiTypeInputProps={{
              selectItems: getCSharpBuildToolOptions(getString),
              placeholder: getString('select'),
              multiTypeInputProps: {
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED]
              }
            }}
            disabled={readonly}
          />
        </Container>
      )}
      {getMultiTypeFromValue(template?.spec?.args) === MultiTypeInputType.RUNTIME && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeTextField
            className={css.removeBpLabelMargin}
            name={`${prefix}spec.args`}
            label={
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={{ dataTooltipId: 'runTestsArgs' }}
              >
                {getString('argsLabel')}
              </Text>
            }
            multiTextInputProps={{
              multiTextInputProps: {
                expressions,
                allowableTypes
              },
              disabled: readonly
            }}
          />
        </Container>
      )}
      {getMultiTypeFromValue(template?.spec?.packages) === MultiTypeInputType.RUNTIME && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeTextField
            className={css.removeBpLabelMargin}
            name={`${prefix}spec.packages`}
            label={
              <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                <Text className={css.inpLabel} color={Color.GREY_600} font={{ size: 'small', weight: 'semi-bold' }}>
                  {getString('packagesLabel')}
                </Text>
                &nbsp;
                {getOptionalSubLabel(getString, 'runTestsPackages')}
              </Layout.Horizontal>
            }
            multiTextInputProps={{
              multiTextInputProps: {
                expressions,
                allowableTypes
              },
              disabled: readonly
            }}
          />
        </Container>
      )}
      {getMultiTypeFromValue(template?.spec?.namespaces) === MultiTypeInputType.RUNTIME && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeTextField
            className={css.removeBpLabelMargin}
            name={`${prefix}spec.namespaces`}
            label={
              <Text
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={{ dataTooltipId: 'runTestsNamespaces' }}
              >
                {getString('ci.runTestsStep.namespaces')}
              </Text>
            }
            multiTextInputProps={{
              multiTextInputProps: {
                expressions,
                allowableTypes
              },
              disabled: readonly
            }}
          />
        </Container>
      )}
      {getMultiTypeFromValue(template?.spec?.runOnlySelectedTests) === MultiTypeInputType.RUNTIME && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <FormMultiTypeCheckboxField
            name={`${prefix}spec.runOnlySelectedTests`}
            label={getString('runOnlySelectedTestsLabel').concat(` (${startCase(getString('common.optionalLabel'))})`)}
            multiTypeTextbox={{
              expressions,
              disabled: readonly,
              allowableTypes
            }}
            setToFalseWhenEmpty={true}
          />
        </Container>
      )}
      {getMultiTypeFromValue(template?.spec?.testAnnotations) === MultiTypeInputType.RUNTIME && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeTextField
            className={css.removeBpLabelMargin}
            name={`${prefix}spec.testAnnotations`}
            label={
              <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                <Text className={css.inpLabel} color={Color.GREY_600} font={{ size: 'small', weight: 'semi-bold' }}>
                  {getString('testAnnotationsLabel')}
                </Text>
                &nbsp;
                {getOptionalSubLabel(getString, 'runTestsTestAnnotations')}
              </Layout.Horizontal>
            }
            multiTextInputProps={{
              multiTextInputProps: {
                expressions,
                allowableTypes
              },
              disabled: readonly
            }}
          />
        </Container>
      )}
      {getMultiTypeFromValue(template?.spec?.preCommand) === MultiTypeInputType.RUNTIME ? (
        shouldRenderRunTimeInputViewWithAllowedValues('spec.preCommand', template) ? (
          <Container className={cx(css.formGroup, stepCss)}>
            {renderMultiTypeInputWithAllowedValues({
              name: `${prefix}spec.preCommand`,
              labelKey: 'ci.preCommandLabel',
              tooltipId: 'runTestsPreCommand',
              fieldPath: 'spec.preCommand',
              getString,
              readonly,
              expressions,
              template
            })}
          </Container>
        ) : (
          renderCommandEditor(`${prefix}spec.preCommand`, 'ci.preCommandLabel', 'runTestsPreCommand')
        )
      ) : null}
      {getMultiTypeFromValue(template?.spec?.postCommand) === MultiTypeInputType.RUNTIME ? (
        shouldRenderRunTimeInputViewWithAllowedValues('spec.postCommand', template) ? (
          <Container className={cx(css.formGroup, stepCss)}>
            {renderMultiTypeInputWithAllowedValues({
              name: `${prefix}spec.postCommand`,
              labelKey: 'ci.postCommandLabel',
              tooltipId: 'runTestsPostCommand',
              fieldPath: 'spec.postCommand',
              getString,
              readonly,
              expressions,
              template
            })}
          </Container>
        ) : (
          renderCommandEditor(`${prefix}spec.postCommand`, 'ci.postCommandLabel', 'runTestsPostCommand')
        )
      ) : null}
      <RunAndRunTestStepInputCommonFields {...props} />
    </FormikForm>
  )
}

const RunTestsStepInputSet = connect(RunTestsStepInputSetBasic)
export { RunTestsStepInputSet }
