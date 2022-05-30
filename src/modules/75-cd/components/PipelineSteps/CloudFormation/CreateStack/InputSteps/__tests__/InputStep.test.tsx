/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, queryByAttribute, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik, FormikForm, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import * as cdServices from 'services/cd-ng'
import * as Portal from 'services/portal'

import CreateStackInputStepRef from '../InputStep'

const initialValues = {
  type: StepType.CloudFormationCreateStack,
  name: 'test name',
  identifier: 'test_identifier',
  timeout: '10m',
  spec: {
    provisionerIdentifier: 'test',
    configuration: {
      stackName: 'testName',
      connectorRef: 'test_ref',
      region: 'test region',
      templateFile: {
        type: 'Remote',
        spec: {}
      }
    }
  }
}

const regionMock = {
  resource: [
    {
      name: 'GovCloud (US-West)',
      value: 'us-gov-west-1'
    },
    {
      name: 'GovCloud (US-East)',
      value: 'us-gov-east-1'
    }
  ]
}
const rolesMock = {
  data: {
    'arn:aws:iam::role/Test': 'TestRole',
    'arn:aws:iam::role/AnotherTest': 'AnotherTestRole'
  }
}

const renderComponent = (data: any) => {
  return render(
    <TestWrapper
      path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
      pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
    >
      <Formik initialValues={{}} onSubmit={() => undefined} formName="wrapperComponentTestForm">
        <FormikForm>
          <CreateStackInputStepRef
            initialValues={initialValues as any}
            stepType={StepType.CloudFormationCreateStack}
            stepViewType={StepViewType.InputSet}
            inputSetData={{
              template: data
            }}
            path={'test'}
            allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
          />
        </FormikForm>
      </Formik>
    </TestWrapper>
  )
}

describe('Test cloudformation create stack template input set', () => {
  beforeAll(() => {
    jest.clearAllMocks()
  })
  test('should render with no data', () => {
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '10m',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Remote',
            spec: {}
          }
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render with timeout data', () => {
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: RUNTIME_INPUT_VALUE,
      spec: {
        provisionerIdentifier: 'testID',
        configuration: {
          stackName: 'testName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: 'Remote',
            spec: {}
          }
        }
      }
    }
    const { getByPlaceholderText } = renderComponent(data)
    expect(getByPlaceholderText('Enter w/d/h/m/s/ms')).toBeTruthy()
  })

  test('should edit timeout data', async () => {
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: RUNTIME_INPUT_VALUE,
      spec: {
        provisionerIdentifier: RUNTIME_INPUT_VALUE,
        configuration: {
          stackName: RUNTIME_INPUT_VALUE,
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: 'Remote',
            spec: {}
          }
        }
      }
    }
    const { getByPlaceholderText } = renderComponent(data)

    const timeout = getByPlaceholderText('Enter w/d/h/m/s/ms')
    act(() => {
      userEvent.type(timeout, '10m')
    })
    expect(timeout).toHaveDisplayValue('10m')
  })

  test('should render with connectorRef data and make connector api request', () => {
    jest.spyOn(cdServices, 'useGetConnector').mockImplementation(
      () =>
        ({
          loading: false,
          data: {
            data: {}
          },
          mutate: jest.fn(),
          refetch: jest.fn()
        } as any)
    )
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'name',
          connectorRef: RUNTIME_INPUT_VALUE,
          region: 'Ireland',
          templateFile: {
            type: 'Remote',
            spec: {}
          }
        }
      }
    }
    const { getByTestId } = renderComponent(data)
    expect(getByTestId('cr-field-test.spec.configuration.connectorRef')).toBeTruthy()
  })

  test('should render with region data and make region api request', async () => {
    jest
      .spyOn(Portal, 'useListAwsRegions')
      .mockImplementation(() => ({ loading: false, data: regionMock, mutate: jest.fn(), refetch: jest.fn() } as any))
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'name',
          connectorRef: 'testRef',
          region: RUNTIME_INPUT_VALUE,
          templateFile: {
            type: 'Remote',
            spec: {}
          }
        }
      }
    }
    const { getByPlaceholderText, getByText } = renderComponent(data)

    const region = await getByPlaceholderText('pipeline.regionPlaceholder')
    await waitFor(() => expect(region).toBeTruthy())
    act(() => {
      userEvent.click(region)
    })
    const selectedRegion = getByText('GovCloud (US-West)')
    userEvent.click(selectedRegion)

    expect(region).toHaveDisplayValue(['GovCloud (US-West)'])
  })

  test('should render with role data and make role api request', async () => {
    jest
      .spyOn(cdServices, 'useGetIamRolesForAws')
      .mockImplementation(() => ({ loading: false, data: rolesMock, mutate: jest.fn(), refetch: jest.fn() } as any))
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'testName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: 'Remote',
            spec: {}
          },
          roleArn: RUNTIME_INPUT_VALUE
        }
      }
    }
    const { container } = renderComponent(data)
    const roleArn = queryByAttribute('name', container, 'test.spec.configuration.roleArn')
    expect(roleArn).toBeTruthy()
  })

  test('should render with runtime data and make capabilities api request', () => {
    jest
      .spyOn(cdServices, 'useCFCapabilitiesForAws')
      .mockReturnValue({ loading: false, data: { data: ['test'] }, mutate: jest.fn(), refetch: jest.fn() } as any)
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'testName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: 'Remote',
            spec: {}
          },
          capabilities: RUNTIME_INPUT_VALUE
        }
      }
    }
    const { getByTestId } = renderComponent(data)
    expect(getByTestId('test.spec.configuration.capabilities')).toBeTruthy()
  })

  test('should render with runtime data show tags component', () => {
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'testName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: 'Remote',
            spec: {}
          },
          tags: {
            spec: {
              content: RUNTIME_INPUT_VALUE
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)
    const tags = queryByAttribute('name', container, 'test.spec.configuration.tags.spec.content')
    act(() => {
      userEvent.type(tags!, `[ { key: 'value' }, { keyTwo: 'value two' } ]`)
    })
    expect(tags).toHaveDisplayValue(`[ { key: 'value' }, { keyTwo: 'value two' } ]`)
  })

  test('should render with runtime data and make aws statues api request', async () => {
    jest
      .spyOn(cdServices, 'useCFStatesForAws')
      .mockReturnValue({ loading: false, data: ['test'], mutate: jest.fn(), refetch: jest.fn() } as any)
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'name',
          connectorRef: 'testRef',
          templateFile: {
            type: 'Remote',
            spec: {}
          },
          skipOnStackStatuses: RUNTIME_INPUT_VALUE
        }
      }
    }
    const { getByTestId } = renderComponent(data)
    expect(getByTestId('test.spec.configuration.skipOnStackStatuses')).toBeTruthy()
  })
})
