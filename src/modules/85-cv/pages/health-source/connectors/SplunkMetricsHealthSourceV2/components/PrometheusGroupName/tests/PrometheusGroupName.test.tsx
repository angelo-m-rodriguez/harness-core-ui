/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { Formik, FormikForm } from '@wings-software/uicore'
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import { TestWrapper } from '@common/utils/testUtils'
import { PrometheusGroupName } from '../PrometheusGroupName'

describe('Unit tests for PrometheusGroupName', () => {
  test('Ensure that a new group name can be added', async () => {
    const mockSetPrometheusGroupNames = jest.fn()
    const mockOnChange = jest.fn()

    const { container, getByText, rerender } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={jest.fn()} formName="wrapperComponentTestForm">
          <FormikForm>
            <PrometheusGroupName
              groupNames={[{ label: 'cv.addNew', value: '' }]}
              setPrometheusGroupNames={mockSetPrometheusGroupNames}
              onChange={mockOnChange}
            />
          </FormikForm>
        </Formik>
      </TestWrapper>
    )

    await waitFor(() => expect(() => getByText('groupName')))
    const icon = container.querySelector('[data-icon="chevron-down"]')
    if (!icon) {
      throw Error('Input was not rendered.')
    }

    // click on new option
    fireEvent.click(icon)
    await waitFor(() => expect(getByText('cv.addNew')).not.toBeNull())
    fireEvent.click(getByText('cv.addNew'))

    //expect modal to show and fill out new name
    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.newPrometheusGroupName')).not.toBeNull())
    await setFieldValue({
      container: document.body,
      type: InputTypes.TEXTFIELD,
      fieldId: 'name',
      value: 'Brand new groupname'
    })

    fireEvent.click(getByText('submit'))
    await waitFor(() =>
      expect(mockOnChange).toHaveBeenLastCalledWith('groupName', {
        label: 'Brand new groupname',
        value: 'Brand new groupname'
      })
    )

    // re rendre componnt and ensure value is selected
    rerender(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={jest.fn()} formName="wrapperComponentTestForm">
          <FormikForm>
            <PrometheusGroupName
              groupNames={[
                { label: 'cv.addNew', value: '' },
                {
                  label: 'Brand new groupname',
                  value: 'Brand new groupname'
                }
              ]}
              setPrometheusGroupNames={mockSetPrometheusGroupNames}
              onChange={mockOnChange}
              item={{
                label: 'Brand new groupname',
                value: 'Brand new groupname'
              }}
            />
          </FormikForm>
        </Formik>
      </TestWrapper>
    )

    await waitFor(() => expect(container.querySelector('input[value="Brand new groupname"]')).not.toBeNull())
  })
})
