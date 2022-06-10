/* eslint-disable @typescript-eslint/no-shadow */
/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { get } from 'lodash-es'
import type { FormikProps } from 'formik'
import React, { useMemo } from 'react'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { ServiceDefinition } from 'services/cd-ng'
import type { K8sApplyFormData } from './K8sInterface'
import K8sOverrideValuesListView from './K8sOverrideValuesListView'
interface K8sManifestSelectionProps {
  formik: FormikProps<K8sApplyFormData>
  deploymentType: ServiceDefinition['type']
}

function K8sOverrideValuesManifest({ deploymentType, formik }: K8sManifestSelectionProps): JSX.Element {
  const {
    state: {
      selectionState: { selectedStepId = '' }
    },
    isReadonly,
    allowableTypes
  } = usePipelineContext()

  //storing values from overrides in listofManifests
  const listOfManifests = useMemo(() => {
    return get(formik, 'values.spec.overrides', [])
  }, [selectedStepId])

  return (
    <K8sOverrideValuesListView
      listOfManifests={listOfManifests}
      isReadonly={isReadonly}
      deploymentType={deploymentType}
      allowableTypes={allowableTypes}
      formik={formik}
    />
  )
}

export default K8sOverrideValuesManifest
