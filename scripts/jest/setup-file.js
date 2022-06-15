/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import '@testing-library/jest-dom'
import { enableMapSet, setAutoFreeze } from 'immer'
import { noop } from 'lodash-es'

// set up Immer
setAutoFreeze(false)
enableMapSet()

process.env.TZ = 'UTC'

document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document
  }
})
window.HTMLElement.prototype.scrollIntoView = jest.fn()
window.scrollTo = jest.fn()

window.fetch = jest.fn((url, options) => {
  fail(`A fetch is being made to url '${url}' with options:
${JSON.stringify(options, null, 2)}
Please mock this call.`)
  throw new Error()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

jest.mock('@common/hooks/useTelemetryInstance', () => {
  return {
    useTelemetryInstance: () => {
      return {
        identify: () => void 0,
        track: () => void 0,
        page: () => void 0,
        initialized: true
      }
    }
  }
})

jest.mock('@harness/help-panel', () => ({
  ...jest.requireActual('@harness/help-panel'),
  HelpPanel: () => 'Help Panel'
}))

jest.mock('react-timeago', () => () => 'dummy date')
jest.mock('@delegates/modals/DelegateModal/useCreateDelegateModal', () => () => ({
  openDelegateModal: noop
}))

jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const { getComputedStyle } = window
window.getComputedStyle = elt => getComputedStyle(elt)

jest.setTimeout(10000)
jest.retryTimes(3)
