/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'

import { TestWrapper } from '@common/utils/testUtils'
import { CreateStackVariableStep } from '../VariableView'
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const renderComponent = (props: any) => {
  return render(
    <TestWrapper>
      <CreateStackVariableStep
        {...props}
        stageIdentifier="qaStage"
        onUpdate={jest.fn()}
        stepType={StepType.CloudFormationCreateStack}
      />
    </TestWrapper>
  )
}

describe('Create stack Variable view ', () => {
  test('initial render', () => {
    const values = {
      type: StepType.CloudFormationCreateStack,
      name: 'testname',
      identifier: 'testId',
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
    const data = {
      initialValues: values,
      metadataMap: {
        yamlProperties: 'provisionerIdentifier',
        yamlOutputProperties: 'provisionerIdentifier',
        test: 'provisionerIdentifier'
      },
      variablesData: values
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('initial render inline with no values', () => {
    const values = {
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: '',
            spec: {}
          }
        }
      }
    }
    const data = {
      initialValues: values,
      metadataMap: {},
      variablesData: values
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render with inline template', () => {
    const spec = {
      type: StepType.CloudFormationCreateStack,
      name: 'name',
      identifier: 'id',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provId',
        configuration: {
          stackName: 'stackName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: 'Inline',
            spec: {
              templateBody: `|-
                  AWSTemplateFormatVersion: 2010-09-09
                  Parameters:
                    Name:
                      Description: 'Well, that'
                      Type: String
                    OtherName:
                      Description: 'Other Name'
                      Type: String
                  Resources:
                    SMS1TMFB:
                      Type: 'My::Secret::Test::MODULE'
                      Properties:
                        Name: !Ref Name
                        SecretString: '{"username":"MasterUsername2","password":"secret-password2"}`
            }
          }
        }
      }
    }
    const data = {
      initialValues: spec,
      metadataMap: {},
      variablesData: spec
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render with S3url template', () => {
    const spec = {
      type: StepType.CloudFormationCreateStack,
      name: 'name',
      identifier: 'id',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provId',
        configuration: {
          stackName: 'stackName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: 'Inline',
            spec: {
              templateUrl: 'some url'
            }
          }
        }
      }
    }
    const data = {
      initialValues: spec,
      metadataMap: {},
      variablesData: spec
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render with remote template', () => {
    const spec = {
      type: StepType.CloudFormationCreateStack,
      name: 'name',
      identifier: 'id',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provId',
        configuration: {
          stackName: 'stackName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: 'Inline',
            spec: {
              store: {
                spec: {
                  connectorRef: 'connRef'
                }
              }
            }
          }
        }
      }
    }
    const data = {
      initialValues: spec,
      metadataMap: {},
      variablesData: spec
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render with parameter overrides', () => {
    const spec = {
      type: StepType.CloudFormationCreateStack,
      name: 'name',
      identifier: 'id',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provId',
        configuration: {
          stackName: 'stackName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: '',
            spec: {}
          },
          parameterOverrides: [
            { name: 'OtherName', value: 'OtherValue2', type: 'String' },
            { name: 'Name', value: 'avalue', type: 'String' }
          ]
        }
      }
    }
    const data = {
      initialValues: spec,
      metadataMap: {},
      variablesData: spec
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render with parameters', () => {
    const spec = {
      type: StepType.CloudFormationCreateStack,
      name: 'name',
      identifier: 'id',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provId',
        configuration: {
          stackName: 'stackName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: '',
            spec: {}
          },
          parameters: [
            {
              identifier: 'id',
              store: {
                type: 'Github',
                spec: {
                  gitFetchType: 'branch',
                  connectorRef: 'ref',
                  repoName: 'myRepo',
                  branch: 'main',
                  paths: ['pathOne', 'pathTwo']
                }
              }
            }
          ]
        }
      }
    }
    const data = {
      initialValues: spec,
      metadataMap: {},
      variablesData: spec
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render with tags', () => {
    const spec = {
      type: StepType.CloudFormationCreateStack,
      name: 'name',
      identifier: 'id',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provId',
        configuration: {
          stackName: 'stackName',
          connectorRef: 'testRef',
          region: 'Ireland',
          templateFile: {
            type: '',
            spec: {}
          },
          tags: {
            spec: {
              content: `[{ 'key': 'value' }]`
            }
          }
        }
      }
    }
    const data = {
      initialValues: spec,
      metadataMap: {
        yamlProperties: 'tags',
        yamlOutputProperties: 'tags',
        [`[{ 'key': 'value' }]`]: 'test'
      },
      variablesData: spec
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })
})
