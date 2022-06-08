/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'

import { MultiLogLine, MultiLogLineProps } from './MultiLogLine'

const props: MultiLogLineProps = {
  lineNumber: 100,
  limit: 100,
  currentSearchIndex: 0,
  searchText: '',
  isFullScreen: false,
  text: {
    logLevel: 'INFO',
    createdAt: '12:30 AM',
    log: 'Error: something went wrong'
  }
}
describe('<MultiLogLine /> tests', () => {
  test('snapshot test', () => {
    const { container } = render(<MultiLogLine {...props} />)
    expect(container).toMatchSnapshot()
  })

  test('search works', () => {
    const { container } = render(<MultiLogLine {...props} searchText="wrong" searchIndices={{ log: [1] }} />)
    expect(container).toMatchSnapshot()

    expect(container.querySelector('[data-search-result-index="1"]')?.innerHTML).toBe('wrong')
  })

  test('search with highlight works', () => {
    const { container } = render(
      <MultiLogLine {...props} searchText="wrong" searchIndices={{ log: [1] }} currentSearchIndex={1} />
    )
    expect(container).toMatchSnapshot()
    expect(container.querySelector('[data-current-search-result="true"]')?.innerHTML).toBe('wrong')
    expect(container.querySelector('[data-search-result-index="1"]')?.innerHTML).toBe('wrong')
  })

  test('works with link containing search text', () => {
    const { container } = render(
      <MultiLogLine
        text={{
          logLevel: 'info',
          createdAt: '20/08/2021 11:12:18',
          log: '+ echo @wings-software:registry=https://npm.pkg.github.com'
        }}
        searchIndices={{
          log: [0]
        }}
        lineNumber={1}
        limit={58}
        searchText="pk"
        currentSearchIndex={0}
        isFullScreen={false}
      />
    )

    const link = container.querySelector<HTMLAnchorElement>('a.ansi-decoration-link')

    expect(link).toMatchInlineSnapshot(`
      <a
        class="ansi-decoration-link"
        href="https://npm.pkg.github.com"
        rel="noreferrer"
        target="_blank"
      >
        https://npm.
        <mark
          data-current-search-result="true"
          data-search-result-index="0"
        >
          pk
        </mark>
        g.github.com
      </a>
    `)
    expect(container).toMatchSnapshot()
  })

  test('works with mutliple links containing search text', () => {
    const { container } = render(
      <MultiLogLine
        text={{
          logLevel: 'info',
          createdAt: '20/08/2021 11:12:18',
          log: 'registry=https://npm.pkg.github.com, pkg:harness, registry=https://npm.pkg.github.com, registry=https://npm.pkg.github.com'
        }}
        searchIndices={{
          log: [0, 1, 2, 3]
        }}
        lineNumber={1}
        limit={58}
        searchText="pk"
        currentSearchIndex={0}
        isFullScreen={false}
      />
    )

    expect(container.querySelectorAll('[data-search-result-index="0"]').length).toBe(1)
    expect(container).toMatchSnapshot()
  })
})
