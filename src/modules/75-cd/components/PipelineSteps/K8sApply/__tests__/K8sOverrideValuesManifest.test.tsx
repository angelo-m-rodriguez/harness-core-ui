/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Formik } from '@harness/uicore'
import { findAllByText, findByText, fireEvent, getByText, render, waitFor } from '@testing-library/react'
import React from 'react'
import { TestWrapper } from '@common/utils/testUtils'
import K8sOverrideValuesManifest from '../K8sOverrideValuesManifest'

const formik = {
  initialValues: {
    overrides: [
      {
        manifest: {
          identifier: 'Test',
          type: 'Values' as any,
          spec: {
            store: {
              type: 'Git',
              spec: {
                branch: 'test-3',
                connectorRef: 'account.test',
                gitFetchType: 'Branch',
                paths: ['temp'],
                repoName: 'reponame'
              }
            }
          }
        }
      }
    ]
  },
  values: {
    overrides: [
      {
        manifest: {
          identifier: 'Test',
          type: 'Values' as any,
          spec: {
            store: {
              type: 'Git',
              spec: {
                branch: 'test-3',
                connectorRef: 'account.test',
                gitFetchType: 'Branch',
                paths: ['temp'],
                repoName: 'reponame'
              }
            }
          }
        }
      }
    ]
  }
}

describe('OverrideYamlValues test', () => {
  const onSubmit = jest.fn()
  test(`test on add Manifest works correctly`, async () => {
    const { container } = render(
      <TestWrapper>
        <Formik onSubmit={onSubmit} formName={'spec.overrides'} initialValues={formik.initialValues}>
          <K8sOverrideValuesManifest deploymentType="Kubernetes" formik={formik as any} />
        </Formik>
      </TestWrapper>
    )

    const addManifestButton = await getByText(container, 'pipelineSteps.serviceTab.manifestList.addManifest')
    expect(addManifestButton).toBeDefined()
    fireEvent.click(addManifestButton)

    //open manifest wizard on clicking add manifest
    const portal = document.getElementsByClassName('bp3-dialog')[0]

    const manifestLabel = await waitFor(() =>
      findByText(portal as HTMLElement, 'pipeline.manifestType.manifestRepoType')
    )
    expect(manifestLabel).toBeDefined()

    //check if Values Yaml maifest is present
    const manifestTypes = await waitFor(() =>
      findAllByText(portal as HTMLElement, 'pipeline.manifestTypeLabels.ValuesYaml')
    )
    expect(manifestTypes).toBeDefined()
    //if present click on it
    fireEvent.click(manifestTypes[0])

    const continueButton = await findByText(portal as HTMLElement, 'continue')
    expect(continueButton).toBeDefined()
    //after selecting manifest,click continue
    fireEvent.click(continueButton)

    //manifest sources present as per selected manifest
    const manifestSource = await waitFor(() =>
      findByText(portal as HTMLElement, 'common.specify pipeline.manifestTypeLabels.ValuesYaml store')
    )
    expect(manifestSource).toBeDefined()
    fireEvent.click(manifestTypes[0])
  })
})
