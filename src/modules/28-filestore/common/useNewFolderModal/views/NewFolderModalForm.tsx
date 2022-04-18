/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Container,
  Formik,
  FormikForm as Form,
  FormInput,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  Label,
  Layout
} from '@harness/uicore'
import * as Yup from 'yup'
import { useToaster } from '@common/components'

import { useStrings } from 'framework/strings'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { NameSchema } from '@common/utils/Validation'
import { FooterRenderer } from '@filestore/common/ModalComponents/ModalComponents'

interface NewFolderDTO {
  name: string
}

interface NewFolderModalData {
  data?: NewFolderDTO
  editMode: boolean
  onSubmit?: (resourceGroup: NewFolderDTO) => void
  onCancel: () => void
}

const NewFolderForm: React.FC<NewFolderModalData> = props => {
  const { onCancel } = props
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  const { showSuccess } = useToaster()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()

  const handleSubmit = async (values: NewFolderDTO): Promise<void> => {
    //TODO: Integrate with API
    try {
      if (values) {
        showSuccess(getString('filestore.folderSuccessCreated', { name: values.name }))
      }
    } catch (e) {
      /* istanbul ignore next */
      modalErrorHandler?.showDanger(getRBACErrorMessage(e))
    }
  }
  return (
    <Formik<NewFolderDTO>
      initialValues={{
        name: ''
      }}
      formName="resourceGroupModalForm"
      validationSchema={Yup.object().shape({
        name: NameSchema()
      })}
      onSubmit={values => {
        modalErrorHandler?.hide()
        handleSubmit(values)
      }}
    >
      {() => {
        return (
          <Form>
            <Layout.Vertical style={{ justifyContent: 'space-between' }}>
              <Container>
                <ModalErrorHandler bind={setModalErrorHandler} />
                <Label>{getString('name')}</Label>
                <FormInput.Text data-name="name" disabled={false} name="name" placeholder={getString('name')} />
              </Container>
              <FooterRenderer
                type="submit"
                onCancel={onCancel}
                confirmText={getString('create')}
                cancelText={getString('cancel')}
              />
            </Layout.Vertical>
          </Form>
        )
      }}
    </Formik>
  )
}

export default NewFolderForm
