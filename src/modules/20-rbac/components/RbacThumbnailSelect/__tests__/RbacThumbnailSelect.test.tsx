/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Formik } from '@wings-software/uicore'
import { noop } from 'lodash-es'
import { act, render, fireEvent, waitFor } from '@testing-library/react'
import * as useFeaturesLib from '@common/hooks/useFeatures'
import { TestWrapper } from '@common/utils/testUtils'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { RbacThumbnailItem, RbacThumbnailSelect } from '../RbacThumbnailSelect'

const getNonRbacSampleItems = (): RbacThumbnailItem[] => [{ label: 'I1', value: 'i1', icon: 'nav-organization' }]
const getRbacSampleItems = (): RbacThumbnailItem[] => [
  {
    label: 'I1',
    value: 'i1',
    icon: 'nav-organization',
    featureProps: { featureRequest: { featureName: FeatureIdentifier.TEST1 } }
  }
]

describe('RBAC ThumbnailSelect', () => {
  test('renders items without RBAC restrictions', () => {
    const { container } = render(
      <Formik initialValues={{}} onSubmit={noop} formName="test">
        <RbacThumbnailSelect items={getNonRbacSampleItems()} name="nonRbacThumbnail" />
      </Formik>
    )
    expect(container).toMatchSnapshot('non rbac items')
  })

  test('renders items with RBAC restrictions', async () => {
    jest.spyOn(useFeaturesLib, 'useFeature').mockReturnValue({ enabled: false })
    const { container, queryByText } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="rbacThumnNailSelect">
          <RbacThumbnailSelect items={getRbacSampleItems()} name="rRbacThumbnail" />
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot('rbac items should be disabled')

    const targetElement = container.querySelector('.bp3-popover-target')
    act(() => {
      fireEvent.mouseOver(targetElement!)
    })
    await waitFor(() => expect(queryByText('common.levelUp')).toBeTruthy())
  })
})
