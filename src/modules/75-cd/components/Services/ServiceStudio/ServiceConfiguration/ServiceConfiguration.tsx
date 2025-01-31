/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { VisualYamlToggle, VisualYamlSelectedView as SelectedView, Container } from '@harness/uicore'
import { cloneDeep, defaultTo, set } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { parse } from 'yaml'
import produce from 'immer'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { NGServiceConfig, useGetEntityYamlSchema } from 'services/cd-ng'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import DeployServiceDefinition from '@cd/components/PipelineStudio/DeployServiceSpecifications/DeployServiceDefinition/DeployServiceDefinition'
import { DefaultNewPipelineId } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { useServiceContext } from '@cd/context/ServiceContext'
import { setNameIDDescription } from '../../utils/ServiceUtils'
import ServiceStepBasicInfo from './ServiceStepBasicInfo'
import css from './ServiceConfiguration.module.scss'

interface ServiceConfigurationProps {
  serviceData: NGServiceConfig
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `service.yaml`,
  entityType: 'Service',
  width: '100%',
  height: 'calc(100vh - 250px)',
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

function ServiceConfiguration({ serviceData }: ServiceConfigurationProps): React.ReactElement | null {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const {
    state: { pipeline: service },
    updatePipeline,
    isReadonly
  } = usePipelineContext()
  const { isServiceCreateModalView } = useServiceContext()

  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()

  const { data: serviceSchema } = useGetEntityYamlSchema({
    queryParams: {
      entityType: 'Service',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId
    }
  })

  const handleModeSwitch = React.useCallback(
    (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '')
        const serviceSetYamlVisual = parse(yaml).service

        if (serviceSetYamlVisual) {
          const newServiceData = produce({ ...service }, draft => {
            setNameIDDescription(draft, serviceSetYamlVisual)

            set(
              draft,
              'stages[0].stage.spec.serviceConfig.serviceDefinition',
              cloneDeep(serviceSetYamlVisual.serviceDefinition)
            )
          })
          updatePipeline(newServiceData)
        }
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml, serviceSchema]
  )

  if (service.identifier === DefaultNewPipelineId && !isServiceCreateModalView) {
    return null
  }
  return (
    <div className={css.serviceEntity}>
      <div className={css.optionBtns}>
        <VisualYamlToggle
          selectedView={selectedView}
          onChange={nextMode => {
            handleModeSwitch(nextMode)
          }}
          //   disableToggle={!inputSetTemplateYaml}
        />
      </div>
      {selectedView === SelectedView.VISUAL ? (
        <>
          <ServiceStepBasicInfo />
          <DeployServiceDefinition />
        </>
      ) : (
        <Container>
          <YAMLBuilder
            {...yamlBuilderReadOnlyModeProps}
            existingJSON={serviceData}
            bind={setYamlHandler}
            schema={serviceSchema?.data}
            showSnippetSection={false}
            isEditModeSupported={!isReadonly}
          />
        </Container>
      )}
    </div>
  )
}

export default ServiceConfiguration
