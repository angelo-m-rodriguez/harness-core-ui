/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, queryByAttribute } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik, FormikForm, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'

import TemplateFileInputs from '../TemplateFile'

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

const renderComponent = (data: any) => {
  return render(
    <TestWrapper
      path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
      pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
    >
      <Formik initialValues={{}} onSubmit={() => undefined} formName="wrapperComponentTestForm">
        <FormikForm>
          <TemplateFileInputs
            initialValues={initialValues as any}
            stepType={StepType.CloudFormationCreateStack}
            stepViewType={StepViewType.InputSet}
            inputSetData={{
              template: data
            }}
            path="test"
            allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
          />
        </FormikForm>
      </Formik>
    </TestWrapper>
  )
}
describe('Test cloudformation create stack input set', () => {
  test('should render remote template components when template is github repo', async () => {
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
            spec: {
              store: {
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  branch: RUNTIME_INPUT_VALUE,
                  paths: RUNTIME_INPUT_VALUE
                }
              }
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)
    const branch = queryByAttribute('name', container, 'test.spec.configuration.templateFile.spec.store.spec.branch')
    act(() => {
      userEvent.type(branch!, 'main')
    })
    expect(branch).toHaveDisplayValue('main')

    const filePath = queryByAttribute(
      'name',
      container,
      'test.spec.configuration.templateFile.spec.store.spec.paths[0]'
    )
    act(() => {
      userEvent.type(filePath!, 'test/test.cf')
    })
    expect(filePath).toHaveDisplayValue('test/test.cf')
    expect(container).toMatchSnapshot()
  })

  test('should render remote template components when template inline', async () => {
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
            spec: {
              templateBody: RUNTIME_INPUT_VALUE
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)
    const templateBody = queryByAttribute('name', container, 'test.spec.configuration.templateFile.spec.templateBody')
    act(() => {
      userEvent.type(templateBody!, 'test body')
    })
    expect(templateBody).toHaveDisplayValue('test body')
    expect(container).toMatchSnapshot()
  })
})
