/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import type { JiraFieldNG } from 'services/cd-ng'
import { getInitialValueForSelectedField, processFormData, resetForm } from '../helper'
import type { JiraCreateData, JiraCreateFieldType } from '../types'

describe('Jira Create process form data tests', () => {
  test('if duplicate fields are not sent', () => {
    const formValues: JiraCreateData = {
      name: 'jiraCreate',
      identifier: 'jcr',
      timeout: '10m',
      type: 'JiraCreate',
      spec: {
        connectorRef: { label: 'conn', value: 'conn' },
        projectKey: { label: 'pid', value: 'pid', key: 'pid' },
        issueType: { label: 'iss', value: 'iss', key: 'iss' },
        fields: [
          {
            name: 'f1',
            value: 'v1'
          },
          {
            name: 'f2',
            value: { label: 'vb2', value: 'vb2' }
          }
        ],
        selectedOptionalFields: [
          {
            name: 'f2',
            value: { label: 'vb2', value: 'vb2' },
            key: 'f2',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          },
          {
            name: 'f3',
            value: [
              { label: 'v3', value: 'v3' },
              { label: 'v32', value: 'v32' }
            ],
            key: 'f3',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          }
        ]
      }
    }

    const returned = processFormData(formValues)
    expect(returned).toStrictEqual({
      name: 'jiraCreate',
      identifier: 'jcr',
      timeout: '10m',
      type: 'JiraCreate',
      spec: {
        connectorRef: 'conn',
        delegateSelectors: undefined,
        projectKey: 'pid',
        issueType: 'iss',
        fields: [
          {
            name: 'f2',
            value: 'vb2'
          },
          {
            name: 'f3',
            value: 'v3,v32'
          },
          {
            name: 'f1',
            value: 'v1'
          }
        ]
      }
    })
  })

  test('if runtime values work', () => {
    const formValues: JiraCreateData = {
      name: 'jiraCreate',
      identifier: 'jcr',
      timeout: '10m',
      type: 'JiraCreate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        projectKey: '<+expression>',
        issueType: '<+input>',
        fields: [
          {
            name: 'f1',
            value: '<+a.b>'
          }
        ],
        selectedOptionalFields: [
          {
            name: 'f2',
            value: '<+x.y>',
            key: 'f2',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          }
        ]
      }
    }

    const returned = processFormData(formValues)
    expect(returned).toStrictEqual({
      name: 'jiraCreate',
      identifier: 'jcr',
      timeout: '10m',
      type: 'JiraCreate',
      spec: {
        connectorRef: '<+input>',
        projectKey: '<+expression>',
        delegateSelectors: undefined,
        issueType: '<+input>',
        fields: [
          {
            name: 'f2',
            value: '<+x.y>'
          },
          {
            name: 'f1',
            value: '<+a.b>'
          }
        ]
      }
    })
  })

  test('Selected Fields initial value test', () => {
    const savedFields: JiraCreateFieldType[] = [
      {
        name: 'comment',
        value: 'test'
      },
      {
        name: 'priority',
        value: ''
      },
      {
        name: 'nextgen',
        value: ''
      }
    ]
    const field: JiraFieldNG = {
      allowedValues: [],
      key: 'customfield_1',
      name: 'comment',
      schema: {
        array: false,
        type: 'string',
        typeStr: ''
      }
    }
    const selectOptionfield: JiraFieldNG = {
      allowedValues: [
        {
          id: 'P1',
          name: 'P1',
          value: 'P1'
        }
      ],
      key: 'customfield_2',
      name: 'priority',
      schema: {
        array: false,
        type: 'option',
        typeStr: ''
      }
    }
    const multiselectOptionfield: JiraFieldNG = {
      allowedValues: [
        {
          id: '1',
          value: 'yes'
        },
        {
          id: '2',
          value: 'no'
        }
      ],
      key: 'customfield_3',
      name: 'nextgen',
      schema: {
        array: true,
        type: 'option',
        typeStr: 'option'
      }
    }
    let returned = getInitialValueForSelectedField(savedFields, field)
    expect(returned).toStrictEqual('test')
    savedFields[0].value = 1
    returned = getInitialValueForSelectedField(savedFields, field)
    expect(returned).toStrictEqual(1)
    savedFields[1].value = 'P1'
    returned = getInitialValueForSelectedField(savedFields, selectOptionfield)
    expect(returned).toStrictEqual({ label: 'P1', value: 'P1' })

    //Check SINGLE SELECT field values as expression
    savedFields[1].value = '<+pipeline.priority>'
    returned = getInitialValueForSelectedField(savedFields, selectOptionfield)
    expect(returned).toStrictEqual('<+pipeline.priority>')

    //check multiselect field values as Fixed
    savedFields[2].value = 'yes,no'
    returned = getInitialValueForSelectedField(savedFields, multiselectOptionfield)
    expect(returned).toStrictEqual([
      { label: 'yes', value: 'yes' },
      { label: 'no', value: 'no' }
    ])
    //Check multiselect field values as expression
    savedFields[2].value = '<+pipeline.yes>'
    returned = getInitialValueForSelectedField(savedFields, multiselectOptionfield)
    expect(returned).toStrictEqual('<+pipeline.yes>')
    //Check multiselect field values as runtime
    savedFields[2].value = '<+input>'
    returned = getInitialValueForSelectedField(savedFields, multiselectOptionfield)
    expect(returned).toStrictEqual('<+input>')
  })
})

describe('Reset Form tests', () => {
  test('reset form test for connectorRef, projectKey and issueType', () => {
    const formValues = {
      values: {
        name: 'jiraCreate',
        identifier: 'jcr',
        timeout: '10m',
        type: 'JiraCreate',
        spec: {
          connectorRef: '',
          delegateSelectors: undefined,
          projectKey: '',
          issueType: '',
          fields: [
            {
              name: 'f1',
              value: ''
            }
          ]
        }
      },
      setFieldValue: jest.fn()
    } as any

    expect(resetForm(formValues, 'connectorRef')).toBe(undefined)
    expect(resetForm(formValues, 'projectKey')).toBe(undefined)
    expect(resetForm(formValues, 'issueType')).toBe(undefined)
  })
})
