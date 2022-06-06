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
      const { get } = useCache()

      return <div>{JSON.stringify(get('foo'))}</div>
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
      const { get, set } = useCache()
      const onClick = () => set('foo', { a: 2, b: 3 })

      return (
        <div>
          <button onClick={onClick}>update</button>
          <div>{JSON.stringify(get('foo'))}</div>
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
      const { get, set } = useCache()

      const onClick = () => set('foo', { a: 2, b: 3 }, { skipUpdate: true })

      return (
        <div>
          <button onClick={onClick}>update</button>
          <div>{JSON.stringify(get('foo'))}</div>
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
