/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { fireEvent, queryByAttribute, render, waitFor } from '@testing-library/react'
import React from 'react'
import { MultiTypeInputType } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import type { ManifestTypes } from '@pipeline/components/ManifestSelection/ManifestInterface'
import { ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import InlineManifest from '../InlineManifest'

const initialValues = {
  identifier: '',
  spec: {
    store: {
      content: ''
    },
    type: 'Inline'
  },
  type: ManifestDataType.Values
}
const props = {
  stepName: 'Manifest details',
  expressions: [],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  handleSubmit: jest.fn(),
  selectedManifest: 'Values' as ManifestTypes,
  manifestIdsList: [],
  identifier: '',
  content: ''
}
describe('Inline tests', () => {
  test('submits with right payload', async () => {
    const { container } = render(
      <TestWrapper>
        <InlineManifest initialValues={initialValues} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    fireEvent.change(queryByNameAttribute('identifier')!, { target: { value: 'testidentifier' } })
    fireEvent.change(queryByNameAttribute('content')!, { target: { value: 'Content' } })

    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(props.handleSubmit).toHaveBeenCalledWith({
        manifest: {
          identifier: 'testidentifier',
          type: ManifestDataType.Values,
          spec: {
            store: {
              spec: {
                content: 'Content'
              },
              type: 'Inline'
            }
          }
        }
      })
    })
  })

  test('renders form in edit mode', () => {
    const defaultProps = {
      stepName: 'Manifest details',
      manifestIdsList: [],
      expressions: [],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      initialValues: {
        identifier: 'testidentifier',
        type: ManifestDataType.KustomizePatches,
        spec: {
          store: {
            spec: {
              content: 'demo'
            },
            type: 'Inline'
          }
        }
      },
      selectedManifest: ManifestDataType.KustomizePatches,
      prevStepData: {
        store: 'Inline'
      },
      handleSubmit: jest.fn()
    }
    const { container } = render(
      <TestWrapper>
        <InlineManifest {...defaultProps} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
