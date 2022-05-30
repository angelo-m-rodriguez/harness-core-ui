/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { HTMLTable } from '@blueprintjs/core'

import { useStrings } from 'framework/strings'
import type { ServiceExecutionSummary } from 'services/cd-ng'

import css from './CDExecutionSummary.module.scss'

export interface ServicesTableProps {
  services: ServiceExecutionSummary[]
}

export function ServicesTable({ services }: ServicesTableProps): React.ReactElement {
  const { getString } = useStrings()

  return (
    <HTMLTable small className={css.servicesTable}>
      <thead>
        <tr>
          <th>{getString('service')}</th>
          <th>{getString('primaryArtifactText')}</th>
          <th>{getString('sidecar')}</th>
        </tr>
      </thead>
      <tbody>
        {services.map((service, i) => (
          <tr key={`${service.identifier}-${i}`}>
            <td>{service.displayName}</td>
            <td
              dangerouslySetInnerHTML={{
                __html: service.artifacts?.primary
                  ? getString('artifactDisplay', {
                      image: (service.artifacts.primary as unknown as any).imagePath,
                      tag: (service.artifacts.primary as unknown as any).tag
                    })
                  : '-'
              }}
            />
            <td
              dangerouslySetInnerHTML={{
                __html:
                  service.artifacts?.sidecars && service.artifacts?.sidecars.length > 0
                    ? service.artifacts.sidecars
                        .map(artifact =>
                          getString('artifactDisplay', {
                            image: (artifact as unknown as any).imagePath,
                            tag: (artifact as unknown as any).tag
                          })
                        )
                        .join(', ')
                    : '-'
              }}
            />
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  )
}
