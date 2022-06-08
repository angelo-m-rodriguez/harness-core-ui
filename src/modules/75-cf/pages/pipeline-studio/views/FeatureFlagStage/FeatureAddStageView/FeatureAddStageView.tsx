/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Color } from '@harness/design-system'
import { Text, Container, Formik, FormikForm, Button } from '@wings-software/uicore'
import * as Yup from 'yup'
import type { FormikErrors } from 'formik'
import type { FeatureFlagStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useStrings } from 'framework/strings'
import { NameIdDescription } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { isDuplicateStageId } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { illegalIdentifiers, regexIdentifier } from '@common/utils/StringUtils'
import { createTemplate, getTemplateNameWithLabel } from '@pipeline/utils/templateUtils'
import type { TemplateSummaryResponse } from 'services/template-ng'
import css from './FeatureAddStageView.module.scss'

export interface FeatureAddEditStageViewProps {
  data?: StageElementWrapper<FeatureFlagStageElementConfig>
  template?: TemplateSummaryResponse
  onSubmit?: (values: StageElementWrapper<FeatureFlagStageElementConfig>, identifier: string) => void
  onChange?: (values: Values) => void
}

interface Values {
  identifier: string
  name: string
  description?: string
}

export const FeatureAddEditStageView: React.FC<FeatureAddEditStageViewProps> = ({
  data,
  onSubmit,
  template,
  onChange
}): JSX.Element => {
  const { getString } = useStrings()
  const {
    state: { pipeline }
  } = usePipelineContext()

  const initialValues: Values = {
    identifier: data?.stage?.identifier || '',
    name: data?.stage?.name || '',
    description: data?.stage?.description
  }

  const validationSchema = () =>
    Yup.lazy((_values: Values): any =>
      Yup.object().shape({
        name: Yup.string()
          .trim()
          .required(getString('fieldRequired', { field: getString('stageNameLabel') })),
        identifier: Yup.string().when('name', {
          is: val => val?.length,
          then: Yup.string()
            .required(getString('validation.identifierRequired'))
            .matches(regexIdentifier, getString('validation.validIdRegex'))
            .notOneOf(illegalIdentifiers)
        })
      })
    )

  const handleValidate = (values: Values): FormikErrors<Values> => {
    const errors: { name?: string } = {}
    if (isDuplicateStageId(values.identifier, pipeline?.stages || [])) {
      // This always occurs
      // errors.name = getString('validation.identifierDuplicate')
    }
    if (data) {
      onChange?.(values)
    }
    return errors
  }

  const handleSubmit = (values: Values): void => {
    if (data?.stage) {
      if (template) {
        onSubmit?.({ stage: createTemplate(values, template) }, values.identifier)
      } else {
        data.stage.identifier = values.identifier
        data.stage.name = values.name
        if (values.description) data.stage.description = values.description
        if (!data.stage.spec) data.stage.spec = {}

        onSubmit?.(data, values.identifier)
      }
    }
  }

  return (
    <div className={css.stageCreate}>
      <Container padding="medium">
        <Formik
          enableReinitialize
          initialValues={initialValues}
          formName="featureAddStage"
          validationSchema={validationSchema}
          validate={handleValidate}
          onSubmit={handleSubmit}
        >
          {formikProps => (
            <FormikForm>
              <Text font={{ weight: 'bold' }} icon="cf-main" iconProps={{ size: 16 }} margin={{ bottom: 'medium' }}>
                {getString('pipelineSteps.build.create.aboutYourStage')}
              </Text>
              <NameIdDescription
                formikProps={formikProps}
                identifierProps={{
                  inputLabel: getString('stageNameLabel')
                }}
              />
              {template && (
                <Text
                  icon={'template-library'}
                  margin={{ top: 'medium', bottom: 'medium' }}
                  font={{ size: 'small' }}
                  iconProps={{ size: 12, margin: { right: 'xsmall' } }}
                  color={Color.BLACK}
                >
                  {`Using Template: ${getTemplateNameWithLabel(template)}`}
                </Text>
              )}

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
    </div>
  )
}
