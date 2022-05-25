/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { FormikForm } from '@wings-software/uicore'
import { Formik } from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import { PrometheusQueryViewer, PrometheusQueryViewerProps } from './PrometheusQueryViewer'

function WrapperComponent(props: PrometheusQueryViewerProps): any {
  return (
    <TestWrapper>
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <FormikForm>
          <PrometheusQueryViewer {...props} />
        </FormikForm>
      </Formik>
    </TestWrapper>
  )
}

describe('Unit tests for PrometheusQueryViewer', () => {
  test('Verify that fetchRecordsButton should not render if there is no query', async () => {
    const onChange = jest.fn()
    const { queryByText } = render(<WrapperComponent values={{} as any} onChange={onChange} />)
    const fetchRecordsButton = await waitFor(() => queryByText('cv.monitoringSources.gcoLogs.fetchRecords'))

    expect(fetchRecordsButton).toBeNull()
  })
})
