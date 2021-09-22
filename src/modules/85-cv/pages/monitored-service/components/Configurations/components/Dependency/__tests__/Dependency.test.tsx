import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import type { UseGetReturn } from 'restful-react'
import * as cvService from 'services/cv'
import { TestWrapper } from '@common/utils/testUtils'
import { monitoredServiceList, monitoredServiceForm } from './Dependency.mock'
import Dependency from '../Dependency'

describe('Dependency compoennt', () => {
  test('should render all cards', async () => {
    jest
      .spyOn(cvService, 'useGetMonitoredServiceList')
      .mockReturnValue({ data: monitoredServiceList } as UseGetReturn<any, any, any, any>)
    const onSuccessMock = jest.fn()

    const { container, getByText } = render(
      <TestWrapper>
        <Dependency onSuccess={onSuccessMock} value={monitoredServiceForm} />
      </TestWrapper>
    )
    await waitFor(() => expect(container.querySelector('[class*="leftSection"]')).not.toBeNull())
    expect(container.querySelectorAll('[class~="serviceCard"]').length).toBe(3)
    expect(container.querySelector('[class*="monitoredServiceCategory"][class*="infrastructure"]')).not.toBeNull()
    expect(container.querySelector('[class*="monitoredServiceCategory"][class*="application"]')).not.toBeNull()
    fireEvent.click(getByText('save'))
    await waitFor(() =>
      expect(onSuccessMock).toHaveBeenLastCalledWith({
        dependencies: [],
        description: '',
        environmentRef: 'production',
        identifier: 'manager_production',
        isEdit: false,
        name: 'manager_production',
        serviceRef: 'manager',
        sources: {
          changeSources: [
            {
              category: 'Deployment',
              enabled: true,
              identifier: 'harness_cd',
              name: 'Harness CD',
              spec: {},
              type: 'HarnessCD'
            }
          ],
          healthSources: []
        },
        tags: {},
        type: 'Application'
      })
    )
  })

  test('Ensure loading is displayed on api loadng', async () => {
    jest
      .spyOn(cvService, 'useGetMonitoredServiceList')
      .mockReturnValue({ loading: true } as UseGetReturn<any, any, any, any>)
    const onSuccessMock = jest.fn()

    const { container } = render(
      <TestWrapper>
        <Dependency onSuccess={onSuccessMock} value={monitoredServiceForm} />
      </TestWrapper>
    )
    await waitFor(() => expect(container.querySelector('[class*="leftSection"]')).not.toBeNull())
    await waitFor(() => expect(container.querySelector('[class*="spinner"]')).not.toBeNull())
  })
})
