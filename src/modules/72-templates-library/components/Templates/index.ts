/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { StepTemplate } from '@templates-library/components/Templates/StepTemplate/StepTemplate'
import { StageTemplate } from '@templates-library/components/Templates/StageTemplate/StageTemplate'
import { PipelineTemplate } from '@templates-library/components/Templates/PipelineTemplate/PipelineTemplate'
import templateFactory from './TemplatesFactory'

// common
templateFactory.registerTemplate(new StepTemplate())
templateFactory.registerTemplate(new StageTemplate())
templateFactory.registerTemplate(new PipelineTemplate())
