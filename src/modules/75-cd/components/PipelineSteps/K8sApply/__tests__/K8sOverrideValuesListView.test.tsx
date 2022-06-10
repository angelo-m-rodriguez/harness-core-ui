/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { MultiTypeInputType } from '@harness/uicore'
import { findByText, fireEvent, render, waitFor } from '@testing-library/react'
import React from 'react'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import { TestWrapper } from '@common/utils/testUtils'
import {
  buildBitbucketPayload,
  buildGithubPayload,
  buildGitlabPayload,
  buildGitPayload
} from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { ServiceDefinition } from 'services/cd-ng'
import K8sOverrideValuesListView from '../K8sOverrideValuesListView'
import { getBuildPayload } from '../K8shelper'

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

describe('OverrideYamlValues List View tests', () => {
  test('delete manifest list works correctly', async () => {
    const props = {
      isReadonly: false,
      deploymentType: 'Kubernetes' as ServiceDefinition['type'],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      listOfManifests: [formik.values]
    }
    const responseState = {
      executeQuery: () => {
        return fromValue({})
      }
    }
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <DragDropContext onDragEnd={jest.fn()}>
            <Droppable droppableId="test">
              {provided => (
                <div ref={provided.innerRef}>
                  <K8sOverrideValuesListView {...props} formik={formik as any} />
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Provider>
      </TestWrapper>
    )
    const deleteManifestBtn = container.querySelector('[data-icon="main-trash"]') as Element
    expect(deleteManifestBtn).toBeDefined()
    fireEvent.click(deleteManifestBtn)
    expect(container).toMatchSnapshot()
  })

  test(`edit manifest list works correctly`, async () => {
    const props = {
      isReadonly: false,
      deploymentType: 'Kubernetes' as ServiceDefinition['type'],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      listOfManifests: [formik.values]
    }
    const responseState = {
      executeQuery: () => {
        return fromValue({})
      }
    }
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <DragDropContext onDragEnd={jest.fn()}>
            <Droppable droppableId="test">
              {provided => (
                <div ref={provided.innerRef}>
                  <K8sOverrideValuesListView {...props} formik={formik as any} />
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Provider>
      </TestWrapper>
    )
    const editManifestBtn = container.querySelectorAll('[data-icon="Edit"]')[0]
    expect(editManifestBtn).toBeDefined()
    fireEvent.click(editManifestBtn)

    const portal = document.getElementsByClassName('bp3-dialog')[0]
    const manifestLabel = await waitFor(() =>
      findByText(portal as HTMLElement, 'pipeline.manifestType.manifestRepoType')
    )
    expect(manifestLabel).toBeDefined()

    //check if change with edit icon is present
    const changeBtn = container.querySelectorAll('[data-icon="Edit"]')
    expect(changeBtn).toBeDefined()
    fireEvent.click(changeBtn[0])

    //closing the wizard
    const closeButton = portal.querySelector("button[class*='crossIcon']") as Element
    fireEvent.click(closeButton)
  })

  test('Test getbuildPlayload function', () => {
    expect(getBuildPayload('Git')).toBe(buildGitPayload)
    expect(getBuildPayload('Gitlab')).toBe(buildGitlabPayload)
    expect(getBuildPayload('Github')).toBe(buildGithubPayload)
    expect(getBuildPayload('Bitbucket')).toBe(buildBitbucketPayload)
  })
})
