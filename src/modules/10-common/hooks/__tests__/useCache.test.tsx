/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render } from '@testing-library/react'

import { useCache, __danger_clear_cache, __danger_set_cache } from '../useCache'

describe('useCache tests', () => {
  beforeEach(() => {
    __danger_clear_cache()
  })

  test('can read data from cache', () => {
    __danger_set_cache('foo', { a: 1, b: 2 })
    const TestComponent = (): React.ReactElement => {
      const { getCache } = useCache()

      return <div>{JSON.stringify(getCache('foo'))}</div>
    }
    const { container } = render(<TestComponent />)

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          {"a":1,"b":2}
        </div>
      </div>
    `)
  })

  test('data update triggers rerender', async () => {
    __danger_set_cache('foo', { a: 1, b: 2 })
    const TestComponent = (): React.ReactElement => {
      const { getCache, setCache } = useCache()
      const onClick = () => setCache('foo', { a: 2, b: 3 })

      return (
        <div>
          <button onClick={onClick}>update</button>
          <div>{JSON.stringify(getCache('foo'))}</div>
        </div>
      )
    }
    const { container, findByText } = render(<TestComponent />)

    const btn = await findByText('update')

    fireEvent.click(btn)

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          <button>
            update
          </button>
          <div>
            {"a":2,"b":3}
          </div>
        </div>
      </div>
    `)
  })

  test('data update can skip update', async () => {
    __danger_set_cache('foo', { a: 1, b: 2 })
    const TestComponent = (): React.ReactElement => {
      const { getCache, setCache } = useCache()

      const onClick = () => setCache('foo', { a: 2, b: 3 }, { skipUpdate: true })

      return (
        <div>
          <button onClick={onClick}>update</button>
          <div>{JSON.stringify(getCache('foo'))}</div>
        </div>
      )
    }
    const { container, findByText } = render(<TestComponent />)

    const btn = await findByText('update')

    fireEvent.click(btn)

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          <button>
            update
          </button>
          <div>
            {"a":1,"b":2}
          </div>
        </div>
      </div>
    `)
  })

  test('can listen to updates for specific keys', async () => {
    __danger_set_cache('foo', { a: 1, b: 2 })
    __danger_set_cache('bar', { a: 1, b: 2 })
    const TestComponent = (): React.ReactElement => {
      const { getCache, setCache } = useCache(['foo'])
      const onClick = () => setCache('bar', { a: 2, b: 3 })

      return (
        <div>
          <button onClick={onClick}>update</button>
          <div>{JSON.stringify(getCache('foo'))}</div>
        </div>
      )
    }
    const { container, findByText } = render(<TestComponent />)

    const btn = await findByText('update')

    fireEvent.click(btn)

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          <button>
            update
          </button>
          <div>
            {"a":1,"b":2}
          </div>
        </div>
      </div>
    `)
  })
})
