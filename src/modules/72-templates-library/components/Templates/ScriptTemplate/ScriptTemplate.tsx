import React from 'react'
import { Color } from '@harness/design-system'
import { Template, TemplateProps } from '@templates-library/components/AbstractTemplate/Template'
import { StepTemplateFormWithRef } from '@templates-library/components/TemplateStudio/StepTemplateCanvas/StepTemplateForm/StepTemplateForm'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import type { NGTemplateInfoConfig } from 'services/template-ng'
import type { TemplateFormRef } from '@templates-library/components/TemplateStudio/TemplateStudio'

export class ScriptTemplate extends Template<NGTemplateInfoConfig> {
  protected type = TemplateType.Script
  protected name = 'Script Template'
  protected color = Color.TEAL_700

  protected defaultValues: NGTemplateInfoConfig = {
    name: 'Template name',
    identifier: 'Template_name',
    versionLabel: '',
    type: 'Script'
  }

  renderTemplateCanvas(props: TemplateProps<NGTemplateInfoConfig>): JSX.Element {
    return <StepTemplateFormWithRef ref={props.formikRef as TemplateFormRef<unknown> | undefined} />
  }
}
