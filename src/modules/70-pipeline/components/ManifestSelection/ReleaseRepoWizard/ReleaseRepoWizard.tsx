/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { StepWizard } from '@harness/uicore'
import React from 'react'

import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import RepoStore from './RepoStore'
import RepoDetails from './RepoDetails'
import css from '../ManifestWizard/ManifestWizard.module.scss'

function ReleaseRepoWizard(props: any): React.ReactElement {
  const { allowableTypes, isReadonly } = usePipelineContext()

  const { expressions } = useVariablesExpression()

  return (
    <StepWizard className={css.manifestWizard} onCompleteWizard={props.onClose}>
      <RepoStore
        stepName="Release Repo Store"
        name="Release Repo Store"
        expressions={expressions}
        allowableTypes={allowableTypes}
        isReadonly={isReadonly}
        handleConnectorViewChange={() => props.handleConnectorViewChange(true)}
        handleStoreChange={props.handleStoreChange}
        initialValues={props.initialValues}
      />
      {props.newConnectorView ? props.newConnectorSteps : null}
      <RepoDetails
        key={'RepoDetails'}
        name={'RepoDetails'}
        expressions={expressions}
        allowableTypes={allowableTypes}
        stepName={'RepoDetails'}
        initialValues={props.initialValues}
        manifest={props.manifest}
        handleSubmit={values => {
          props.handleSubmit(values)
          props.onClose()
        }}
        isReadonly={isReadonly}
      />
    </StepWizard>
  )
}

export default ReleaseRepoWizard
