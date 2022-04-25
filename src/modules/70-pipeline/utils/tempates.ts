/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type * as yup from 'yup'
import { IdentifierSchemaWithoutHook, NameSchemaWithoutHook } from '@common/utils/Validation'
import type { UseStringsReturn } from 'framework/strings'
import { isContextTypeNotStageTemplate } from '@pipeline/components/PipelineStudio/PipelineUtils'

export function getNameAndIdentifierSchema(
  getString: UseStringsReturn['getString'],
  contextType?: string
): { [key: string]: yup.Schema<string | undefined> } {
  return isContextTypeNotStageTemplate(contextType)
    ? {
        name: NameSchemaWithoutHook(getString, {
          requiredErrorMsg: getString('pipelineSteps.build.create.stageNameRequiredError')
        }),
        identifier: IdentifierSchemaWithoutHook(getString)
      }
    : {}
}
