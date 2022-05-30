/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text } from '@harness/uicore'
import { String, useStrings } from 'framework/strings'
import type { ServiceExecutionSummary } from 'services/cd-ng'
import css from '@cd/components/ServicePopoverCard/ServicePopoverCard.module.scss'

export interface ServicePopoveCardProps {
  service: ServiceExecutionSummary
}

export function ServicePopoverCard(props: ServicePopoveCardProps): React.ReactElement {
  const { service } = props
  const { getString } = useStrings()

  return (
    <div className={css.main}>
      <String tagName="div" className={css.title} stringID="primaryArtifactText" />
      {service?.artifacts?.primary ? (
        <>
          {!!(service.artifacts.primary as unknown as any).imagePath && (
            <Text color="grey800" font={'small'}>
              {getString('imageLabel')}: {(service.artifacts.primary as unknown as any).imagePath}
            </Text>
          )}
          {!!(service.artifacts.primary as unknown as any).tag && (
            <Text color="grey800" font={'small'}>
              {getString('common.artifactTag')}: {(service.artifacts.primary as unknown as any).tag}
            </Text>
          )}
          {!!(service.artifacts.primary as unknown as any).version && (
            <Text color="grey800" font={'small'}>
              {getString('version')}: {(service.artifacts.primary as unknown as any).version}
            </Text>
          )}
          {!!(service.artifacts.primary as unknown as any).artifactDirectory && (
            <Text color="grey800" font={'small'}>
              {getString('pipeline.artifactsSelection.artifactDirectory')}:{' '}
              {(service.artifacts.primary as unknown as any).artifactDirectory}
            </Text>
          )}
          {!!(service.artifacts.primary as unknown as any).artifactPath && (
            <Text color="grey800" font={'small'}>
              {getString('pipeline.artifactPathLabel')}: {(service.artifacts.primary as unknown as any).artifactPath}
            </Text>
          )}
          {!!(service.artifacts.primary as unknown as any).artifactPathFilter && (
            <Text color="grey800" font={'small'}>
              {getString('pipeline.artifactPathFilterLabel')}:{' '}
              {(service.artifacts.primary as unknown as any).artifactPathFilter}
            </Text>
          )}
        </>
      ) : (
        <String tagName="div" stringID="noArtifact" />
      )}
      {service?.artifacts?.sidecars && service.artifacts.sidecars.length > 0 ? (
        <>
          <String tagName="div" className={css.title} stringID="sidecarsText" />
          {service.artifacts.sidecars.map((artifact, index) => (
            <div key={index}>
              {!!(artifact as unknown as any).imagePath && (
                <Text color="grey800" font={'small'}>
                  {getString('imageLabel')}: {(artifact as unknown as any).imagePath}
                </Text>
              )}
              {!!(artifact as unknown as any).tag && (
                <Text color="grey800" font={'small'}>
                  {getString('common.artifactTag')}: {(artifact as unknown as any).tag}
                </Text>
              )}
              {!!(artifact as unknown as any).version && (
                <Text color="grey800" font={'small'}>
                  {getString('version')}: {(artifact as unknown as any).version}
                </Text>
              )}
            </div>
          ))}
        </>
      ) : null}
    </div>
  )
}
