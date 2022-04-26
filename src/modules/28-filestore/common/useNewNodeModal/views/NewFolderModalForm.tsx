/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Container,
  Formik,
  FormikForm as Form,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  Layout
} from '@harness/uicore'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'

import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'

import { useToaster } from '@common/components'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { useStrings } from 'framework/strings'
import { NameSchema, IdentifierSchema } from '@common/utils/Validation'
import { FooterRenderer } from '@filestore/common/ModalComponents/ModalComponents'
import { useCreate, useGetFolderNodes } from 'services/cd-ng'
import { FileStoreNodeTypes, NewFolderDTO } from '@filestore/interfaces/FileStore'

interface NewFolderModalData {
  data?: NewFolderDTO
  editMode: boolean
  onSubmit?: (resourceGroup: NewFolderDTO) => void
  close: () => void
  parentIdentifier: string
  callback: (node: any) => void
}

const NewFolderForm: React.FC<NewFolderModalData> = props => {
  const { close, parentIdentifier, callback } = props
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { mutate: createFolder } = useCreate({
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier }
  })

  const { mutate: getFolderNodes } = useGetFolderNodes({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    }
  })

  const { getString } = useStrings()
  const { showSuccess } = useToaster()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()

  const handleSubmit = async (values: NewFolderDTO): Promise<void> => {
    const { identifier, name, type } = values
    try {
      const data = new FormData()
      data.append('identifier', identifier)
      data.append('name', name)
      data.append('type', type)
      data.append('parentIdentifier', parentIdentifier)
      const response = await createFolder(data as any)

      if (response.status === 'SUCCESS') {
        getFolderNodes({
          identifier: parentIdentifier,
          name: '',
          type: FileStoreNodeTypes.FOLDER
        }).then(res => {
          if (res?.data) {
            callback(res.data)
            showSuccess(getString('filestore.folderSuccessCreated', { name: values.name }))
            close()
          }
        })
      }
    } catch (e) {
      modalErrorHandler?.showDanger(e.data.message)
    }
  }
  return (
    <Formik<NewFolderDTO>
      initialValues={{
        name: '',
        identifier: '',
        type: FileStoreNodeTypes.FOLDER
      }}
      formName="newFolder"
      validationSchema={Yup.object().shape({
        name: NameSchema(),
        identifier: IdentifierSchema()
      })}
      onSubmit={values => {
        modalErrorHandler?.hide()
        handleSubmit(values)
      }}
    >
      {() => {
        return (
          <Form style={{ height: '100%' }}>
            <Layout.Vertical style={{ justifyContent: 'space-between' }} height="100%">
              <Container>
                <ModalErrorHandler bind={setModalErrorHandler} />
                <NameId identifierProps={{ isIdentifierEditable: true }} />
              </Container>
              <FooterRenderer
                type="submit"
                onCancel={close}
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
