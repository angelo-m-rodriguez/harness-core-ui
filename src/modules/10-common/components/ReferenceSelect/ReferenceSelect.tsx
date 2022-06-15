/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ExpressionAndRuntimeTypeProps,
  ExpressionAndRuntimeType,
  MultiTypeInputValue,
  Layout,
  Text,
  FixedTypeComponentProps,
  MultiTypeInputType,
  ButtonVariation
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'

import { Classes, Dialog } from '@blueprintjs/core'
import cx from 'classnames'
import type { Scope } from '@common/interfaces/SecretsInterface'
import { useStrings } from 'framework/strings'
import { EntityReferenceProps, EntityReference } from '../EntityReference/EntityReference'
import css from './ReferenceSelect.module.scss'
export interface MinimalObject {
  identifier?: string
  name?: string
}
export interface Item {
  label: string
  value: string
  scope: Scope
}

export interface ReferenceSelectDialogTitleProps {
  componentName?: string
  createNewLabel?: string
  createNewHandler?: () => void
  createNewBtnComponent?: JSX.Element
  isNewConnectorLabelVisible?: boolean
}
export interface ReferenceSelectProps<T extends MinimalObject>
  extends Omit<EntityReferenceProps<T>, 'onSelect'>,
    ReferenceSelectDialogTitleProps {
  name: string
  placeholder: string
  selectAnReferenceLabel: string
  selected?: Item
  createNewLabel?: string
  createNewBtnComponent?: JSX.Element
  createNewHandler?: () => void
  hideModal?: boolean
  selectedRenderer?: JSX.Element
  editRenderer?: JSX.Element
  width?: number
  isNewConnectorLabelVisible?: boolean
  onChange: (record: T, scope: Scope) => void
  disabled?: boolean
  componentName?: string
}

export const ReferenceSelectDialogTitle = (props: ReferenceSelectDialogTitleProps): JSX.Element => {
  const { getString } = useStrings()
  const { componentName, createNewHandler, createNewLabel, createNewBtnComponent, isNewConnectorLabelVisible } = props
  return (
    <Layout.Horizontal flex={{ distribution: 'space-between' }}>
      <Layout.Vertical spacing="xsmall">
        <Text font={{ variation: FontVariation.H4 }}>
          {getString('common.entityReferenceTitle', {
            compName: componentName
          })}
        </Text>
      </Layout.Vertical>

      {createNewBtnComponent
        ? createNewBtnComponent
        : createNewLabel &&
          createNewHandler &&
          (isNewConnectorLabelVisible === undefined ? true : isNewConnectorLabelVisible) && (
            <>
              <Layout.Horizontal className={Classes.POPOVER_DISMISS}>
                <Button
                  variation={ButtonVariation.SECONDARY}
                  onClick={() => {
                    props.createNewHandler?.()
                  }}
                  text={`+ ${createNewLabel}`}
                  margin={{ right: 'small' }}
                ></Button>
              </Layout.Horizontal>
            </>
          )}
    </Layout.Horizontal>
  )
}

export function ReferenceSelect<T extends MinimalObject>(props: ReferenceSelectProps<T>): JSX.Element {
  const {
    name,
    placeholder,
    selected,
    onChange,
    width = 300,
    createNewLabel,
    createNewHandler,
    isNewConnectorLabelVisible = true,
    editRenderer,
    hideModal = false,
    selectedRenderer,
    componentName = '',
    disabled,
    createNewBtnComponent,
    ...referenceProps
  } = props
  const [isOpen, setOpen] = React.useState(false)
  React.useEffect(() => {
    isOpen && setOpen(!hideModal) //this will hide modal if hideModal changes to true in open state
  }, [hideModal])

  return (
    <>
      <Button
        minimal
        data-testid={`cr-field-${name}`}
        className={css.container}
        style={{ width }}
        withoutCurrentColor={true}
        rightIcon="chevron-down"
        iconProps={{ size: 14 }}
        disabled={disabled}
        onClick={e => {
          if (disabled) {
            e.preventDefault()
          } else {
            setOpen(true)
          }
        }}
      >
        {selected ? selectedRenderer || selected.label : <span className={css.placeholder}>{placeholder}</span>}
      </Button>
      <Dialog
        isOpen={isOpen}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={() => setOpen(false)}
        className={cx(css.referenceSelect, css.dialog)}
        title={ReferenceSelectDialogTitle({
          componentName,
          createNewLabel,
          createNewHandler,
          createNewBtnComponent,
          isNewConnectorLabelVisible
        })}
      >
        <div className={cx(css.contentContainer)}>
          {editRenderer && selected && selected.value && <Layout.Horizontal>{editRenderer}</Layout.Horizontal>}
          <EntityReference<T>
            {...referenceProps}
            onSelect={(record, scope) => {
              setOpen(false)
              onChange(record, scope)
            }}
            onCancel={() => {
              setOpen(false)
            }}
            renderTabSubHeading
          />
        </div>
      </Dialog>
    </>
  )
}
export interface MultiTypeReferenceInputProps<T extends MinimalObject>
  extends Omit<ExpressionAndRuntimeTypeProps, 'fixedTypeComponent' | 'fixedTypeComponentProps'> {
  referenceSelectProps: Omit<ReferenceSelectProps<T>, 'onChange'>
}
function MultiTypeReferenceInputFixedTypeComponent<T extends MinimalObject>(
  props: FixedTypeComponentProps & MultiTypeReferenceInputProps<T>['referenceSelectProps']
): React.ReactElement {
  const { onChange, selected, width = 300, ...restProps } = props
  return (
    <ReferenceSelect
      {...restProps}
      selected={selected}
      width={width}
      onChange={(record, scope) => {
        onChange?.({ record, scope } as any, MultiTypeInputValue.SELECT_OPTION, MultiTypeInputType.FIXED)
      }}
    />
  )
}
export function MultiTypeReferenceInput<T extends MinimalObject>(props: MultiTypeReferenceInputProps<T>): JSX.Element {
  const { referenceSelectProps, ...rest } = props
  return (
    <ExpressionAndRuntimeType<MultiTypeReferenceInputProps<T>['referenceSelectProps']>
      width={referenceSelectProps.width}
      {...rest}
      fixedTypeComponentProps={referenceSelectProps}
      fixedTypeComponent={MultiTypeReferenceInputFixedTypeComponent}
    />
  )
}
