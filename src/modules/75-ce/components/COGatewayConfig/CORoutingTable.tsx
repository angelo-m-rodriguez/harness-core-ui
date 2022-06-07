/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { isEmpty as _isEmpty, omit as _omit, debounce as _debounce } from 'lodash-es'
import { FieldArray, Select, TextInput } from '@wings-software/uicore'
import { Formik } from 'formik'
import type { Field } from '@wings-software/uicore/dist/components/FieldArray/FieldArray'
import type { PortConfig } from 'services/lw'
import css from './COGatewayConfig.module.scss'

interface SelectItem {
  label: string
  value: string
}

const protocols: SelectItem[] = [
  {
    label: 'http',
    value: 'http'
  },
  {
    label: 'https',
    value: 'https'
  }
]

const actions: SelectItem[] = [
  {
    label: 'Redirect',
    value: 'redirect'
  },
  {
    label: 'Forward',
    value: 'forward'
  }
]

interface CORoutingTableProps {
  routingRecords: PortConfig[]
  setRoutingRecords: (records: PortConfig[]) => void
}
const CORoutingTable: React.FC<CORoutingTableProps> = props => {
  const [forwardConfigRows, setForwardConfigRows] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!_isEmpty(props.routingRecords) && _isEmpty(forwardConfigRows)) {
      const configRows: Record<string, boolean> = {}
      props.routingRecords.forEach((record, _index) => {
        if (record.action === 'forward') {
          configRows[_index] = true
        }
      })
      setForwardConfigRows(configRows)
    }
  }, [props.routingRecords])

  const getItembyValue = (items: SelectItem[], value: string): SelectItem => {
    return items.filter(x => x.value == value)[0]
  }

  const getTextInput: Field['renderer'] = (value, _rowIndex, handleChange) => (
    <TextInput
      defaultValue={value}
      style={{ border: 'none', marginBottom: 0 }}
      onChange={e => handleChange((e.currentTarget as HTMLInputElement).value)}
    />
  )

  const NumericInput: Field['renderer'] = (value, _rowIndex, handleChange) => {
    return (
      <TextInput
        defaultValue={value}
        value={value}
        style={{ border: 'none', marginBottom: 0 }}
        onChange={e => {
          const text = Number((e.currentTarget as HTMLInputElement).value)
          handleChange(text && !isNaN(text) ? text : 0)
        }}
      />
    )
  }

  const getProtocolSelect: Field['renderer'] = (value, _rowIndex, handleChange) => (
    <Select
      className={css.selectCell}
      value={getItembyValue(protocols, value)}
      items={protocols}
      onChange={item => handleChange(item.value)}
    />
  )

  const fields: Field[] = [
    {
      name: 'protocol',
      label: 'PROTOCOL',
      renderer: getProtocolSelect
    },
    {
      name: 'port',
      label: 'PORT',
      renderer: NumericInput
    },
    {
      name: 'action',
      label: 'ACTION',
      renderer: (value, rowIndex, handleChange) => (
        <Select
          className={css.selectCell}
          value={getItembyValue(actions, value)}
          items={actions}
          onChange={item => {
            handleChange(item.value)
            if (item.value === 'forward') {
              setForwardConfigRows(prevRecord => ({ ...prevRecord, [rowIndex]: true }))
            } else if (forwardConfigRows[rowIndex]) {
              setForwardConfigRows(prevRecord => _omit(prevRecord, rowIndex))
            }
          }}
        />
      )
    },
    {
      name: 'target_protocol',
      label: 'TARGET PROTOCOL',
      renderer: getProtocolSelect
    },
    {
      name: 'target_port',
      label: 'TARGET PORT',
      renderer: NumericInput
    },
    {
      name: 'redirect_url',
      label: 'REDIRECT URL',
      renderer: (value, _rowIndex, handleChange) => (
        <TextInput
          defaultValue={value}
          disabled={forwardConfigRows[_rowIndex]}
          style={{ border: 'none', marginBottom: 0 }}
          onChange={e => handleChange((e.currentTarget as HTMLInputElement).value)}
        />
      )
    },
    {
      name: 'server_name',
      label: 'SERVER NAME',
      renderer: getTextInput
    },
    {
      name: 'routing_rules',
      label: 'PATH MATCH',
      renderer: (value, _rowIndex, handleChange) => (
        <TextInput
          defaultValue={value}
          style={{ border: 'none', marginBottom: 0 }}
          onChange={e => handleChange((e.currentTarget as HTMLInputElement).value)}
          data-testid="routingRules"
        />
      )
    }
  ]

  const getInitialData = () => {
    return props.routingRecords.map(_record => {
      return {
        ..._record,
        routing_rules: _isEmpty(_record['routing_rules']) ? '' : _record['routing_rules']?.[0].path_match
      }
    })
  }

  const handleFielArrayChange = _debounce(data => {
    const portConfig = [...(data.modifiedRows as Array<any>)]
    portConfig.forEach(config => {
      const routingRules = config['routing_rules']
      config['routing_rules'] = !_isEmpty(routingRules)
        ? [{ path_match: Array.isArray(routingRules) ? routingRules[0].path_match : routingRules }]
        : []
      if (!_isEmpty(config.port)) {
        config.port = Number(config.port)
      }
      if (!_isEmpty(config.target_port)) {
        config.target_port = Number(config.target_port)
      }
    })
    props.setRoutingRecords(portConfig)
  }, 500)

  return (
    <div className={css.portConfigTable}>
      <Formik
        initialValues={{ routingTableData: getInitialData() }}
        enableReinitialize={true}
        onSubmit={values => {
          console.log(values) // eslint-disable-line
        }}
      >
        {formikProps => (
          <form onSubmit={formikProps.handleSubmit}>
            <FieldArray
              label={''}
              name={'routingTableData'}
              fields={fields}
              onChange={data => handleFielArrayChange(data)}
            />
          </form>
        )}
      </Formik>
    </div>
  )
}

export default CORoutingTable
