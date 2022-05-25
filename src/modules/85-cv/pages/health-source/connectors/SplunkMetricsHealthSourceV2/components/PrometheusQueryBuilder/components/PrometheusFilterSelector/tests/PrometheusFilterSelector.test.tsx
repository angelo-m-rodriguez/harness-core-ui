/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { FormikForm } from '@wings-software/uicore'
import { Formik } from 'formik'
import * as cvService from 'services/cv'
import { TestWrapper } from '@common/utils/testUtils'
import { PrometheusFilterSelector } from '../PrometheusFilterSelector'

describe('Unit tests for PrometheusFilterSelector', () => {
  test('Ensure that key and value are selectable', async () => {
    jest.spyOn(cvService, 'useGetLabeValues').mockReturnValue({
      data: {
        data: ['value1', 'value2', 'value3']
      }
    } as any)

    const onUpdateFilterMock = jest.fn()
    const { container, getByText } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <FormikForm>
            <PrometheusFilterSelector
              items={[
                { label: 'filter1', value: 'filter1' },
                { label: 'filter2', value: 'filter2' },
                { label: 'filter3', value: 'filter3' }
              ]}
              name="serviceFilter"
              label="ServiceFilter"
              onUpdateFilter={onUpdateFilterMock}
              onRemoveFilter={jest.fn()}
              connectorIdentifier="1234_connector"
            />
          </FormikForm>
        </Formik>
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('ServiceFilter')).not.toBeNull())
    const input = container.querySelector('.bp3-tag-input-values')
    if (!input) {
      throw Error('Input was not rendered.')
    }

    // click on new option
    fireEvent.click(input)

    //click on an option and expect secondary menu to show up
    await waitFor(() => expect(container.querySelector('.bp3-menu')).not.toBeNull())
    fireEvent.click(container.querySelector('input[value="filter2"]')!)

    // select value from secondary menu
    await waitFor(() => expect(document.body.querySelector('[class*="valuePopover"]')).not.toBeNull())
    fireEvent.click(getByText('value3'))
    await waitFor(() => expect(document.body.querySelector('[class*="valuePopover"]')).toBeNull())

    await waitFor(() => expect(onUpdateFilterMock).toHaveBeenCalledWith({ label: 'filter2:value3', value: 'filter2' }))
  })

  test('Ensure error state is rendered when popover api errors', async () => {
    const refetchMock = jest.fn()
    jest.spyOn(cvService, 'useGetLabeValues').mockReturnValue({
      error: { data: { message: 'mockError' } },
      refetch: refetchMock as unknown
    } as any)

    const onUpdateFilterMock = jest.fn()
    const { container, getByText } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <FormikForm>
            <PrometheusFilterSelector
              items={[
                { label: 'filter1', value: 'filter1' },
                { label: 'filter2', value: 'filter2' },
                { label: 'filter3', value: 'filter3' }
              ]}
              name="serviceFilter"
              label="ServiceFilter"
              onUpdateFilter={onUpdateFilterMock}
              onRemoveFilter={jest.fn()}
              connectorIdentifier="1234_connector"
            />
          </FormikForm>
        </Formik>
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('ServiceFilter')).not.toBeNull())
    const input = container.querySelector('.bp3-tag-input-values')
    if (!input) {
      throw Error('Input was not rendered.')
    }

    // click on new option
    fireEvent.click(input)

    //click on an option and expect secondary menu to show up
    await waitFor(() => expect(container.querySelector('.bp3-menu')).not.toBeNull())
    fireEvent.click(container.querySelector('input[value="filter1"]')!)

    // expect error state and hit retry
    await waitFor(() => expect(document.body.querySelector('[class*="valuePopover"]')).not.toBeNull())
    getByText('mockError')
    fireEvent.click(getByText('Retry'))

    await waitFor(() => expect(refetchMock).toHaveBeenCalled())
  })

  test('Ensure remove item is called when an iitem is removed', async () => {
    const onRemoveFilterMock = jest.fn()
    const { container, getByText } = render(
      <TestWrapper>
        <Formik
          initialValues={{
            serviceFilter: [
              { label: 'filter1', value: 'filter1' },
              { label: 'filter2', value: 'filter2' }
            ]
          }}
          onSubmit={jest.fn()}
        >
          <FormikForm>
            <PrometheusFilterSelector
              items={[
                { label: 'filter1', value: 'filter1' },
                { label: 'filter2', value: 'filter2' },
                { label: 'filter3', value: 'filter3' }
              ]}
              name="serviceFilter"
              label="ServiceFilter"
              onUpdateFilter={jest.fn()}
              onRemoveFilter={onRemoveFilterMock}
              connectorIdentifier="1234_connector"
            />
          </FormikForm>
        </Formik>
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('ServiceFilter')).not.toBeNull())
    const tags = container.querySelectorAll('[class*="MultiSelect--tag"]')
    expect(tags.length).toBe(2)

    fireEvent.click(tags[0].querySelector('.bp3-tag-remove')!)
    await waitFor(() => expect(onRemoveFilterMock).toHaveBeenCalledWith(0))
  })
})
