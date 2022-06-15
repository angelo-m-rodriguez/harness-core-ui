/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'
import { defaultTo } from 'lodash-es'
import {
  getMultiTypeFromValue,
  MultiTypeInputType,
  Layout,
  Label,
  Color,
  Button,
  FormInput,
  MultiSelectOption
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { TFMonaco } from '../../../Common/Terraform/Editview/TFMonacoEditor'
import { TemplateTypes } from '../../CloudFormationInterfaces.types'
import RemoteTags from './RemoteTags'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../../CloudFormation.module.scss'

interface TagsProps {
  allowableTypes: MultiTypeInputType[]
  readonly: boolean | undefined
  formik: any
  regions: MultiSelectOption[]
}

export const Tags = ({ allowableTypes, readonly = false, formik, regions }: TagsProps): JSX.Element => {
  const { getString } = useStrings()
  const { setFieldValue, values } = formik
  const [showRemoteTags, setShowRemoteTags] = useState<boolean>(false)
  const tagsType = defaultTo(values?.spec?.configuration?.tags?.type, TemplateTypes.Inline)
  const remoteTagsPath = values?.spec?.configuration?.tags?.spec?.store?.spec?.paths
  /* istanbul ignore next */
  const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const fieldName = 'spec.configuration.tags'
    if (e.target.value === TemplateTypes.Inline) {
      setFieldValue(fieldName, {
        type: TemplateTypes.Inline,
        spec: {
          content: ''
        }
      })
    } else if (e.target.value === TemplateTypes.Remote) {
      setFieldValue(fieldName, {
        type: TemplateTypes.Remote,
        spec: {
          store: {
            spec: {
              connectorRef: undefined
            }
          }
        }
      })
    }
  }
  const tagLabel = () => (
    <Label style={{ color: Color.GREY_900 }} className={css.configLabel}>
      {getString('optionalField', { name: getString('tagsLabel') })}
    </Label>
  )
  return (
    <>
      <div className={css.templateSelect}>
        <select
          className={css.templateDropdown}
          name="spec.configuration.templateFile.type"
          disabled={readonly}
          value={tagsType}
          onChange={e => {
            /* istanbul ignore next */
            onSelectChange(e)
          }}
          data-testid="tagsOptions"
        >
          <option data-testid="inline" value={TemplateTypes.Inline}>
            {getString('inline')}
          </option>
          <option data-testid="remote" value={TemplateTypes.Remote}>
            {getString('remote')}
          </option>
        </select>
      </div>
      {tagsType === TemplateTypes.Inline && (
        <div className={cx(stepCss.formGroup, stepCss.alignStart, css.addMarginTop, css.addMarginBottom)}>
          <MultiTypeFieldSelector
            name="spec.configuration.tags.spec.content"
            label={tagLabel()}
            defaultValueToReset=""
            allowedTypes={allowableTypes.filter(item => item !== MultiTypeInputType.EXPRESSION)}
            skipRenderValueInExpressionLabel
            disabled={readonly}
          >
            <TFMonaco name="spec.configuration.tags.spec.content" formik={formik} title={getString('tagsLabel')} />
          </MultiTypeFieldSelector>
          {
            /* istanbul ignore next */
            getMultiTypeFromValue(values.tags) === MultiTypeInputType.RUNTIME && (
              <ConfigureOptions
                value={values.spec?.configuration?.spec?.tags?.spec?.content}
                type="String"
                variableName="spec.configuration.tags.spec.content"
                showRequiredField={false}
                showDefaultField={false}
                showAdvanced={true}
                onChange={value => {
                  setFieldValue('spec.configuration.tags.spec.content', value)
                }}
                isReadonly={readonly}
              />
            )
          }
        </div>
      )}
      {tagsType === TemplateTypes.Remote && (
        <Layout.Vertical className={css.addMarginBottom}>
          {tagLabel()}
          <div className={cx(css.configFile, css.addMarginBottom)}>
            <div className={css.configField}>
              <>
                <a
                  data-testid="remoteTags"
                  className={cx(css.configPlaceHolder, css.truncate)}
                  data-name="config-edit"
                  onClick={() => {
                    setShowRemoteTags(true)
                  }}
                >
                  {getMultiTypeFromValue(remoteTagsPath) === MultiTypeInputType.RUNTIME
                    ? `/${remoteTagsPath}`
                    : remoteTagsPath?.[0]
                    ? remoteTagsPath?.[0]
                    : getString('cd.cloudFormation.remoteTags')}
                </a>
                <Button
                  minimal
                  icon="Edit"
                  withoutBoxShadow
                  iconProps={{ size: 16 }}
                  data-name="config-edit"
                  withoutCurrentColor={true}
                />
              </>
            </div>
          </div>
        </Layout.Vertical>
      )}
      {tagsType === TemplateTypes.S3URL && (
        <Layout.Vertical className={css.addMarginBottom}>
          {tagLabel()}
          <FormInput.Text
            name="spec.configuration.tags.spec.tagsUrl"
            label=""
            placeholder="http://www.test.com"
            className={css.addMarginTop}
          />
        </Layout.Vertical>
      )}
      <RemoteTags
        readonly={readonly}
        allowableTypes={allowableTypes}
        showModal={showRemoteTags}
        onClose={() => {
          /* istanbul ignore next */
          setShowRemoteTags(false)
        }}
        initialValues={values}
        setFieldValue={setFieldValue}
        regions={regions}
      />
    </>
  )
}
