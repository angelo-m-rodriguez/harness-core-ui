/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Formik, FormikForm, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { useListAwsRegions } from '../../__tests__/ApiRequestMocks'

import TagsInputs from '../TagsInputs'

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
      tags: {
        type: 'Remote',
        spec: {}
      },
      parameters: []
    }
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
          <TagsInputs
            initialValues={initialValues as any}
            stepType={StepType.CloudFormationCreateStack}
            stepViewType={StepViewType.InputSet}
            inputSetData={{
              template: data
            }}
            path="test"
            readonly={false}
            allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
          />
        </FormikForm>
      </Formik>
    </TestWrapper>
  )
}

describe('Test cloudformation create stack tags input set', () => {
  test('should render remote tags', () => {
    useListAwsRegions()
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
          tags: {
            store: {
              type: 'S3Url',
              spec: {
                connectorRef: RUNTIME_INPUT_VALUE,
                urls: RUNTIME_INPUT_VALUE
              }
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render remote tags with github params', async () => {
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
          tags: {
            store: {
              type: 'Github',
              spec: {
                connectorRef: 'testRef',
                repoName: RUNTIME_INPUT_VALUE,
                commitId: RUNTIME_INPUT_VALUE,
                branch: RUNTIME_INPUT_VALUE,
                paths: RUNTIME_INPUT_VALUE
              }
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })
})
