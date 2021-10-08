import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { TimelineRow } from '../TimelineRow'
import { series } from './TimelineRow.mock'

describe('Unit tests for TimelineRow', () => {
  test('Ensure timeline component renders correctly', async () => {
    const { getByText } = render(<TimelineRow labelName="label1" labelWidth={200} data={series} />)
    await waitFor(() => expect(getByText('label1')).not.toBeNull())
  })
  test('Ensure loading state is rendered', async () => {
    const { container } = render(<TimelineRow labelName="label1" labelWidth={200} data={[]} isLoading={true} />)
    await waitFor(() => expect(container.querySelector('[data-testid="timelineLoading"]')).not.toBeNull())
  })
  test('Ensure no data state is rendered', async () => {
    const { getByText } = render(
      <TimelineRow labelName="label1" labelWidth={200} data={[]} noDataMessage={'no data'} />
    )
    await waitFor(() => expect(getByText('no data')).not.toBeNull())
  })
})
