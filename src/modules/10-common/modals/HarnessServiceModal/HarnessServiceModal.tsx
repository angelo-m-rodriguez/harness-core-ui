/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import cx from 'classnames'
import { omit } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Dialog, Classes } from '@blueprintjs/core'
import { Layout, Container, Button, Formik } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { NameIdDescriptionTags, PageSpinner } from '@common/components'
import { useToaster } from '@common/exports'
import { NameSchema, IdentifierSchema } from '@common/utils/Validation'
import { useStrings } from 'framework/strings'
import { useCreateServicesV2, useUpsertServiceV2, ServiceRequestDTO } from 'services/cd-ng'
import type { HarnessServicetModalProps } from './HarnessServiceModal.types'
import { getHarnessServiceModalFormDetails } from './HarnessServiceModal.utils'

export const HarnessServicetModal: React.FC<HarnessServicetModalProps> = ({
  isEdit,
  data,
  isService,
  formik,
  onCreateOrUpdate,
  closeModal,
  skipServiceCreateOrUpdate,
  name,
  customLoading
}): JSX.Element => {
  const { getString } = useStrings()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const { formName, field } = getHarnessServiceModalFormDetails(name)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    orgIdentifier: string
    projectIdentifier: string
    accountId: string
  }>()

  const { loading: createLoading, mutate: createService } = useCreateServicesV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { loading: updateLoading, mutate: updateService } = useUpsertServiceV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { showSuccess, showError, clear } = useToaster()

  const onSubmit = React.useCallback(
    async (values: ServiceRequestDTO) => {
      if (!skipServiceCreateOrUpdate) {
        try {
          if (isEdit && !isService) {
            const response = await updateService({
              ...omit(values, 'accountId', 'deleted'),
              orgIdentifier,
              projectIdentifier
            })
            if (response.status === 'SUCCESS') {
              clear()
              showSuccess(getString('common.serviceCreated'))
              formik?.setFieldValue('serviceRef', values.identifier)
              onCreateOrUpdate(values)
            }
          } else {
            const response = await createService([{ ...values, orgIdentifier, projectIdentifier }])
            if (response.status === 'SUCCESS') {
              clear()
              showSuccess(getString('common.serviceCreated'))
              formik?.setFieldValue('serviceRef', values.identifier)
              onCreateOrUpdate(values)
            }
          }
        } catch (e) {
          showError(e?.data?.message || e?.message || getString('commonError'))
        }
      } else {
        onCreateOrUpdate(values)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skipServiceCreateOrUpdate, isEdit, isService, orgIdentifier, projectIdentifier, formik]
  )

  if (createLoading || updateLoading || customLoading) {
    return <PageSpinner />
  }

  return (
    <Formik<ServiceRequestDTO>
      initialValues={data}
      formName={formName}
      enableReinitialize={false}
      onSubmit={values => {
        onSubmit(values)
      }}
      validationSchema={Yup.object().shape({
        name: NameSchema({ requiredErrorMsg: getString?.('fieldRequired', { field }) }),
        identifier: IdentifierSchema()
      })}
    >
      {formikProps => (
        <Layout.Vertical
          onKeyDown={e => {
            if (e.key === 'Enter') {
              formikProps.handleSubmit()
            }
          }}
        >
          <NameIdDescriptionTags
            formikProps={formikProps}
            identifierProps={{
              inputLabel: getString('name'),
              inputGroupProps: {
                inputGroup: {
                  inputRef: ref => (inputRef.current = ref)
                }
              },
              isIdentifierEditable: !isEdit
            }}
          />
          <Container padding={{ top: 'xlarge' }}>
            <Button
              data-id="service-save"
              onClick={() => formikProps.submitForm()}
              intent="primary"
              text={getString('save')}
            />
            &nbsp; &nbsp;
            <Button text={getString('cancel')} onClick={closeModal} />
          </Container>
        </Layout.Vertical>
      )}
    </Formik>
  )
}

export const useHarnessServicetModal = (
  props: HarnessServicetModalProps
): { openHarnessServiceModal: () => void; closeHarnessServiceModal: () => void } => {
  const { getString } = useStrings()
  const {
    data,
    isService,
    isEdit,
    formik,
    onClose,
    onCreateOrUpdate,
    className,
    modalTitle,
    skipServiceCreateOrUpdate,
    name,
    customLoading
  } = props
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen
        title={modalTitle || getString('newService')}
        onClose={hideModal}
        enforceFocus={false}
        className={cx('padded-dialog', className, Classes.DIALOG)}
      >
        <HarnessServicetModal
          data={data}
          isEdit={isEdit}
          formik={formik}
          isService={isService}
          onCreateOrUpdate={onCreateOrUpdate}
          closeModal={onClose ? onClose : hideModal}
          name={name}
          skipServiceCreateOrUpdate={skipServiceCreateOrUpdate}
          customLoading={customLoading}
        />
      </Dialog>
    ),
    [customLoading, formik?.values, onCreateOrUpdate]
  )
  return {
    openHarnessServiceModal: showModal,
    closeHarnessServiceModal: hideModal
  }
}
