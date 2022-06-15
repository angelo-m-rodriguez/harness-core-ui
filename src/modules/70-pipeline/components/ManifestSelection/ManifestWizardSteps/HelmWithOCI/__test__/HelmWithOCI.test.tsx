/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, act, queryByAttribute, waitFor, getAllByText } from '@testing-library/react'
import { MultiTypeInputType } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import HelmWithOCI from '../HelmWithOCI'

const props = {
  stepName: 'Manifest details',
  expressions: [],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  handleSubmit: jest.fn(),
  manifestIdsList: []
}

const initValue = {
  identifier: 'name',
  type: ManifestDataType.HelmChart,
  spec: {
    store: {
      type: 'OciHelmChart',
      spec: {
        config: {
          type: 'Generic',
          spec: {
            connectorRef: 'erverv'
          }
        },
        basePath: 'base'
      }
    },
    chartName: 'cName',
    chartVersion: '<+input>',
    helmVersion: 'V380',
    skipResourceVersioning: false
  }
}

const prevStepData = {
  config: {
    type: 'Generic',
    spec: {
      connectorRef: 'erverv'
    }
  },
  basePath: 'base',
  store: 'OciHelmChart',
  connectorRef: {
    label: 'erverv',
    value: 'erverv',
    scope: 'project',
    live: false,
    connector: {
      name: 'erverv',
      identifier: 'erverv',
      description: null,
      orgIdentifier: 'default',
      projectIdentifier: 'defaultproject',
      tags: {},
      type: 'OciHelmRepo',
      spec: {
        helmRepoUrl: 'erv',
        auth: {
          type: 'UsernamePassword',
          spec: {
            username: 're',
            usernameRef: null,
            passwordRef: 'puthraya'
          }
        },
        delegateSelectors: []
      }
    }
  },
  selectedManifest: 'HelmChart'
}

const findConfigurOptionsPopover = (): HTMLElement | null => document.querySelector('.MultiTypeInput--popover')

jest.mock('services/cd-ng', () => ({
  useHelmCmdFlags: jest.fn().mockImplementation(() => ({ data: { data: ['Template', 'Pull'] }, refetch: jest.fn() }))
}))

describe('helm with OCI tests', () => {
  test(`renders without crashing`, () => {
    const initialValues = {
      identifier: 'test',
      type: ManifestDataType.HelmChart,
      spec: {
        helmVersion: 'V380',
        chartName: 'test',
        chartVersion: 'v3',
        basePath: 'helm/chart'
      }
    }
    const { container } = render(
      <TestWrapper>
        <HelmWithOCI {...props} initialValues={initialValues} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('expand advanced section', () => {
    const initialValues = {
      identifier: 'test',
      type: ManifestDataType.HelmChart,
      spec: {
        helmVersion: 'V380',
        chartName: 'test',
        chartVersion: 'v3',
        basePath: 'helm/chart'
      }
    }
    const { getByText } = render(
      <TestWrapper>
        <HelmWithOCI {...props} initialValues={initialValues} />
      </TestWrapper>
    )

    fireEvent.click(getByText('advancedTitle'))

    expect(getByText('skipResourceVersion')).toBeDefined()
    expect(getByText('pipeline.manifestType.helmCommandFlagLabel')).toBeDefined()
  })

  test(`renders correctly in edit mode with connectorref`, () => {
    const { container } = render(
      <TestWrapper>
        <HelmWithOCI {...props} initialValues={initValue} />
      </TestWrapper>
    )

    const manifestIdentifier = container.querySelector(
      'input[placeholder="pipeline.manifestType.manifestPlaceholder"]'
    ) as HTMLInputElement
    expect(manifestIdentifier.value).toBe('name')

    const basePath = container.querySelector(
      'input[placeholder="pipeline.manifestType.basePathPlaceholder"]'
    ) as HTMLInputElement
    expect(basePath.value).toBe('base')

    const chartName = container.querySelector(
      'input[placeholder="pipeline.manifestType.http.chartNamePlaceHolder"]'
    ) as HTMLInputElement
    expect(chartName.value).toBe('cName')

    const chartVersion = container.querySelector('input[placeholder="<+input>"]') as HTMLInputElement
    expect(chartVersion.value).toBe('<+input>')
  })

  test('submits with the right payload', async () => {
    const { container } = render(
      <TestWrapper>
        <HelmWithOCI {...props} initialValues={initValue} prevStepData={prevStepData} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    await act(async () => {
      fireEvent.change(queryByNameAttribute('identifier')!, { target: { value: 'testidentifier' } })
      fireEvent.change(queryByNameAttribute('chartName')!, { target: { value: 'testchart' } })
      fireEvent.change(queryByNameAttribute('basePath')!, { target: { value: 'helm/chart' } })
    })
    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(props.handleSubmit).toHaveBeenCalledWith({
        manifest: {
          identifier: 'testidentifier',
          type: ManifestDataType.HelmChart,
          spec: {
            store: {
              type: 'OciHelmChart',
              spec: {
                config: {
                  type: 'Generic',
                  spec: {
                    connectorRef: 'erverv'
                  }
                },
                basePath: 'helm/chart'
              }
            },
            chartName: 'testchart',
            chartVersion: '<+input>',
            helmVersion: 'V380',
            skipResourceVersioning: false,
            valuesPaths: undefined
          }
        }
      })
    })
  })

  test('prevbutton and empty state', async () => {
    const initialValues = {} as any
    const { container, getByText } = render(
      <TestWrapper>
        <HelmWithOCI {...props} initialValues={initialValues} prevStepData={prevStepData} />
      </TestWrapper>
    )

    fireEvent.click(getByText('back'))

    expect(container.querySelector('.bp3-button-spinner')).toBeDefined()
  })

  test('switch to runtime and submit', async () => {
    const prevData = {
      basePath: 'base',
      store: 'OciHelmChart'
    }
    const initValues = {
      identifier: 'name',
      type: ManifestDataType.HelmChart,
      spec: {
        store: {
          type: 'OciHelmChart',
          spec: {
            config: {
              type: 'Generic',
              spec: {
                connectorRef: 'erverv'
              }
            },
            basePath: 'base'
          }
        },
        chartName: 'cName',
        chartVersion: '<+input>',
        helmVersion: 'V380',
        skipResourceVersioning: false,
        valuesPaths: '<+input>',
        commandFlags: [{ commandType: 'Template', flag: 'flag' }]
      }
    }
    const { container, getByText } = render(
      <TestWrapper>
        <HelmWithOCI {...props} initialValues={initValues} prevStepData={prevData} />
      </TestWrapper>
    )

    //changing basePath to runtime
    fireEvent.click(container.querySelectorAll('.MultiTypeInput--FIXED')[0])
    const findPopover = findConfigurOptionsPopover()
    expect(findPopover).toBeTruthy()
    fireEvent.click(getByText('Runtime input'))

    //changing chartName to runtime
    fireEvent.click(container.querySelectorAll('.MultiTypeInput--FIXED')[0])
    const findPop = document.querySelectorAll('.MultiTypeInput--popover')
    fireEvent.click(getAllByText(findPop[1] as HTMLElement, 'Runtime input')[0])

    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(props.handleSubmit).toHaveBeenCalledWith({
        manifest: {
          identifier: 'name',
          type: ManifestDataType.HelmChart,
          spec: {
            store: {
              type: 'OciHelmChart',
              spec: {
                config: {
                  type: 'Generic',
                  spec: {
                    connectorRef: ''
                  }
                },
                basePath: '<+input>'
              }
            },
            chartName: '<+input>',
            chartVersion: '<+input>',
            helmVersion: 'V380',
            skipResourceVersioning: false,
            valuesPaths: '<+input>',
            commandFlags: [{ commandType: 'Template', flag: 'flag' }]
          }
        }
      })
    })
  })
})
