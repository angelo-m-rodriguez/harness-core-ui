/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React from 'react'
import qs from 'qs'
import { compile } from 'path-to-regexp'
import { Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'
import { render, fireEvent, act } from '@testing-library/react'
import { defaultTo } from 'lodash-es'

import routes from '@common/RouteDefinitions'
import { PreferenceStoreProvider, PreferenceScope, usePreferenceStore } from '../PreferenceStoreContext'
const ENTITY_TO_SAVE = 'MySavedValue'

const defaultUuid = '1234'

const MyComponent: React.FC<{ children?: React.ReactNode; scope?: PreferenceScope }> = ({
  scope = PreferenceScope.MACHINE
}) => {
  const {
    preference: savedVal,
    setPreference: setSavedVal,
    clearPreference
  } = usePreferenceStore<string>(defaultTo(scope, PreferenceScope.MACHINE), ENTITY_TO_SAVE)

  return (
    <div>
      <button
        data-testid="btnToChangeSavedVal"
        onClick={() => {
          setSavedVal('test')
        }}
      >
        btnToChangeSavedVal
      </button>
      <button
        data-testid="clearPreferentBtn"
        onClick={() => {
          clearPreference()
        }}
      >
        clearPreferentBtn
      </button>
      <span data-testid="valFromPrefStore">{savedVal}</span>
    </div>
  )
}

const ProvidersWrapper: React.FC = ({ children }) => {
  const queryParams = {}
  const path = routes.toProjects({ accountId: defaultUuid })
  const pathParams = { accountId: defaultUuid }
  const search = qs.stringify(queryParams, { addQueryPrefix: true })
  const routePath = compile(path)(pathParams) + search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const history = React.useMemo(() => createMemoryHistory({ initialEntries: [routePath] }), [])

  return (
    <Router history={history}>
      <PreferenceStoreProvider>{children}</PreferenceStoreProvider>
    </Router>
  )
}

describe('Preference Store context tests', () => {
  test('test if the values are being set', async () => {
    const { getByTestId } = render(
      <ProvidersWrapper>
        <MyComponent />
      </ProvidersWrapper>
    )
    const btn = getByTestId('btnToChangeSavedVal')
    await act(async () => {
      fireEvent.click(btn!)
    })
    const textElement = getByTestId('valFromPrefStore')
    expect(textElement.textContent).toBe('test')
  })

  test('clear preference', async () => {
    const { getByTestId } = render(
      <ProvidersWrapper>
        <MyComponent />
      </ProvidersWrapper>
    )
    const btnToChangeVal = getByTestId('btnToChangeSavedVal')
    await act(async () => {
      fireEvent.click(btnToChangeVal!)
    })
    const btnToClearVal = getByTestId('clearPreferentBtn')
    await act(async () => {
      fireEvent.click(btnToClearVal!)
    })
    const textElement = getByTestId('valFromPrefStore')
    expect(textElement.textContent).toBe('')
  })
})
