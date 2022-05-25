/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, SetStateAction } from 'react'
import { FormInput, SelectOption, Formik, FormikForm, Text, Container, Layout, Button } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { PrometheusMonitoringSourceFieldNames } from '@cv/pages/health-source/connectors/PrometheusHealthSource/PrometheusHealthSource.constants'

export interface PrometheusGroupNameProps {
  groupNames?: SelectOption[]
  onChange: (name: string, value: SelectOption) => void
  item?: SelectOption
  setPrometheusGroupNames: Dispatch<SetStateAction<SelectOption[]>>
}

const DialogProps: IDialogProps = {
  isOpen: true,
  usePortal: true,
  autoFocus: true,
  canEscapeKeyClose: true,
  canOutsideClickClose: true,
  enforceFocus: false,
  style: { width: 600, borderLeft: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden' }
}

type CreateGroupName = {
  name: string
}

export function validate(
  values: CreateGroupName,
  groupNames: SelectOption[],
  getString: UseStringsReturn['getString']
): { [key: string]: string } {
  const errors: { [key: string]: string } = {}
  if (!values.name?.trim().length) {
    errors.name = getString('cv.onboarding.selectProductScreen.validationText.name')
  } else if (groupNames.filter(name => name.value === values.name).length) {
    errors.name = getString('cv.monitoringSources.prometheus.validation.uniqueName', { existingName: values.name })
  }
  return errors
}

export function PrometheusGroupName(props: PrometheusGroupNameProps): JSX.Element {
  const { groupNames = [], onChange, item, setPrometheusGroupNames } = props
  const { getString } = useStrings()
  const addNewOption = { label: getString('cv.addNew'), value: '' }

  const [openModal, hideModal] = useModalHook(
    () => (
      <Dialog {...DialogProps} onClose={hideModal}>
        <Formik<CreateGroupName>
          initialValues={{ name: '' }}
          validate={values => validate(values, groupNames, getString)}
          formName="prometheusGroupName"
          onSubmit={values => {
            const createdGroupName = { label: values.name, value: values.name }
            setPrometheusGroupNames(oldNames => [...oldNames, createdGroupName])
            hideModal()
            onChange(PrometheusMonitoringSourceFieldNames.GROUP_NAME, createdGroupName)
          }}
        >
          <FormikForm>
            <Container margin="medium">
              <Text font={{ size: 'medium', weight: 'bold' }} margin={{ bottom: 'large' }}>
                {getString('cv.monitoringSources.prometheus.newPrometheusGroupName')}
              </Text>
              <FormInput.Text name="name" label={getString('cv.monitoringSources.prometheus.groupName')} />
              <Layout.Horizontal spacing="medium" margin={{ top: 'large', bottom: 'large' }}>
                <Button text={getString('submit')} type="submit" intent="primary" />
                <Button text={getString('cancel')} onClick={hideModal} />
              </Layout.Horizontal>
            </Container>
          </FormikForm>
        </Formik>
      </Dialog>
    ),
    [groupNames]
  )

  return (
    <FormInput.Select
      value={item}
      name={PrometheusMonitoringSourceFieldNames.GROUP_NAME}
      label={getString('cv.monitoringSources.prometheus.groupName')}
      items={groupNames || []}
      onChange={selectedItem => {
        if (selectedItem?.label === addNewOption.label) {
          openModal()
        }
        onChange(PrometheusMonitoringSourceFieldNames.GROUP_NAME, selectedItem)
      }}
    />
  )
}
