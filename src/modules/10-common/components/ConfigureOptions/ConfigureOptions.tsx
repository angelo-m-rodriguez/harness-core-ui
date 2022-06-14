/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { CSSProperties } from 'react'
import { Button, Text, Popover, Container, useToggleOpen, Dialog } from '@harness/uicore'
import { Classes, Position, PopoverInteractionKind } from '@blueprintjs/core'
import cx from 'classnames'

import { useStrings } from 'framework/strings'

import ConfigureOptionsDialog, { ConfigureOptionsDialogProps } from './ConfigureOptionsDialog'

import css from './ConfigureOptions.module.scss'

export interface ConfigureOptionsProps extends Omit<ConfigureOptionsDialogProps, 'closeModal' | 'isOpen'> {
  onChange?: (value: string, defaultValue?: string | number, isRequired?: boolean) => void
  className?: string
  style?: CSSProperties
}

export function ConfigureOptions(props: ConfigureOptionsProps): JSX.Element {
  const {
    value,
    isRequired,
    defaultValue,
    onChange,
    showDefaultField = true,
    variableName,
    type,
    showRequiredField = false,
    showAdvanced = false,
    hideExecutionTimeField = false,
    fetchValues,
    className,
    isReadonly = false
  } = props
  const [input, setInput] = React.useState(value)
  const [isHover, setIsHover] = React.useState<boolean>()
  const { isOpen, open: showModal, close: hideModal } = useToggleOpen()
  const { getString } = useStrings()

  React.useEffect(() => {
    setInput(value)
  }, [value])

  const closeModal = React.useCallback(
    (str?: string, defaultStr?: string | number, required?: boolean) => {
      hideModal()
      onChange?.(str ?? input, defaultStr ?? defaultValue, required)
    },
    [hideModal, onChange, input, defaultValue]
  )

  return (
    <React.Fragment>
      <Popover interactionKind={PopoverInteractionKind.HOVER} position={Position.TOP} className={Classes.DARK}>
        <Button
          style={{ color: isHover ? 'var(--primary-6)' : 'var(--grey-400)', ...props.style }}
          className={className}
          minimal
          rightIcon="cog"
          // To avoid non unique IDs in a single form
          id={`configureOptions_${variableName}`}
          onClick={showModal}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        />
        <Container className={css.cogBtnTooltipContainer} padding="medium">
          <Text color={'white'}>{'Configure runtime input options'}</Text>
        </Container>
      </Popover>
      <Dialog
        isOpen={isOpen}
        title={getString('common.configureOptions.configureOptions')}
        enforceFocus={false}
        className={cx(css.dialog, Classes.DIALOG, 'padded-dialog')}
        onClose={() => closeModal()}
        lazy
      >
        <ConfigureOptionsDialog
          closeModal={closeModal}
          isRequired={isRequired}
          isReadonly={isReadonly}
          value={value}
          variableName={variableName}
          type={type}
          showDefaultField={showDefaultField}
          defaultValue={defaultValue}
          hideExecutionTimeField={hideExecutionTimeField}
          showRequiredField={showRequiredField}
          showAdvanced={showAdvanced}
          fetchValues={fetchValues}
        />
      </Dialog>
    </React.Fragment>
  )
}
