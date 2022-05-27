/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { Button, Container, FormikForm, Text } from '@wings-software/uicore'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useStrings } from 'framework/strings'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { isContextTypeNotStageTemplate } from '@pipeline/components/PipelineStudio/PipelineUtils'
import { NameId, NameIdDescriptionTags } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import type { CustomStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import { isDuplicateStageId } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { getNameAndIdentifierSchema } from '@pipeline/utils/tempates'
import { createTemplate } from '@pipeline/utils/templateUtils'
import type { CustomStageMinimalValues, CustomStageMinimalModeProps } from './types'
import css from './CustomStage.module.scss'

const getInitialValues = (data?: StageElementWrapper<CustomStageElementConfig>): CustomStageMinimalValues => {
  return {
    identifier: data?.stage?.identifier || '',
    name: data?.stage?.name || '',
    description: data?.stage?.description,
    tags: data?.stage?.tags || {}
  }
}

export function CustomStageMinimalMode(props: CustomStageMinimalModeProps): React.ReactElement {
  const { getString } = useStrings()
  const { onChange, onSubmit = noop, data, template } = props

  const {
    state: { pipeline },
    contextType
  } = usePipelineContext()

  const handleValidate = (values: CustomStageMinimalValues): Record<string, string | undefined> | undefined => {
    const errors: { name?: string } = {}
    /* istanbul ignore next */
    if (isDuplicateStageId(values.identifier, pipeline?.stages || [])) {
      errors.name = getString('validation.identifierDuplicate')
    }
    /* istanbul ignore next */
    if (data) {
      /* istanbul ignore next */
      onChange?.(values)
    }
    return errors
  }

  const handleSubmit = (values: CustomStageMinimalValues): void => {
    /* istanbul ignore next */
    if (data?.stage) {
      /* istanbul ignore next */
      if (template) {
        onSubmit({ stage: createTemplate(values, template) }, values.identifier)
      } else {
        data.stage.identifier = values.identifier
        data.stage.name = values.name
        data.stage.description = values.description
        data.stage.tags = values.tags
        onSubmit(data, values.identifier)
      }
    }
  }

  return (
    <Container padding="xxlarge" className={css.customStagePopover}>
      <Formik
        enableReinitialize
        initialValues={getInitialValues(data)}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, contextType)
        })}
        validate={handleValidate}
        onSubmit={values => handleSubmit(values)}
      >
        {formikProps => (
          <FormikForm>
            <Text
              icon="custom-stage-icon"
              iconProps={{ size: 16 }}
              margin={{ bottom: 'medium' }}
              className={css.addStageHeading}
            >
              {getString('pipelineSteps.build.create.aboutYourStage')}
            </Text>

            {isContextTypeNotStageTemplate(contextType) &&
              (template ? (
                <NameId
                  identifierProps={{
                    inputLabel: getString('stageNameLabel')
                  }}
                />
              ) : (
                <NameIdDescriptionTags
                  formikProps={formikProps}
                  identifierProps={{
                    inputLabel: getString('stageNameLabel')
                  }}
                />
              ))}
            <Button
              type="submit"
              intent="primary"
              text={getString('pipelineSteps.build.create.setupStage')}
              margin={{ top: 'small' }}
            />
          </FormikForm>
        )}
      </Formik>
    </Container>
  )
}
