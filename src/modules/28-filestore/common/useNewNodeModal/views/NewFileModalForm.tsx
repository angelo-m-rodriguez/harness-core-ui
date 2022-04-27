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
  Layout,
  FormInput
} from '@harness/uicore'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'

import { NameIdDescriptionTags } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'

import { useToaster } from '@common/components'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { useStrings } from 'framework/strings'
import { NameSchema, IdentifierSchema } from '@common/utils/Validation'
import { FooterRenderer } from '@filestore/common/ModalComponents/ModalComponents'
import { useCreate, useGetFolderNodes, FileStoreNodeDTO } from 'services/cd-ng'

import { FileStoreNodeTypes, FileUsage, NewFileDTO, NewFileFormDTO } from '@filestore/interfaces/FileStore'

interface NewFileModalData {
  data?: NewFileDTO
  editMode: boolean
  onSubmit?: (resourceGroup: NewFileDTO) => void
  close: () => void
  parentIdentifier: string
  callback: (node: FileStoreNodeDTO) => void
}

const NewFileForm: React.FC<NewFileModalData> = props => {
  const { close, parentIdentifier, callback } = props
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  const { mutate: createFolder, loading } = useCreate({
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

  const handleSubmit = async (values: any): Promise<void> => {
    try {
      const data = new FormData()
      Object.keys(values).forEach(prop => {
        data.append(prop, values[prop])
      })
      data.append('type', FileStoreNodeTypes.FILE)
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
            showSuccess(getString('filestore.fileSuccessCreated', { name: values.name }))
            close()
          }
        })
      }
    } catch (e) {
      modalErrorHandler?.showDanger(e.data.message)
    }
  }

  const fileUsageItems = React.useMemo(() => {
    return Object.values(FileUsage).map((fs: FileUsage) => ({
      label: fs,
      value: fs
    }))
  }, [])

  return (
    <Formik<NewFileFormDTO>
      initialValues={{
        name: '',
        identifier: '',
        description: '',
        fileUsage: ''
      }}
      formName="newFolder"
      validationSchema={Yup.object().shape({
        name: NameSchema(),
        identifier: IdentifierSchema(),
        fileUsage: NameSchema({ requiredErrorMsg: 'fileusage req' })
      })}
      onSubmit={values => {
        modalErrorHandler?.hide()
        handleSubmit(values)
      }}
    >
      {formikProps => {
        return (
          <Form>
            <Layout.Vertical style={{ justifyContent: 'space-between' }} height="100%">
              <Container>
                <ModalErrorHandler bind={setModalErrorHandler} />
                <NameIdDescriptionTags formikProps={formikProps} />
                <FormInput.Select
                  style={{ width: 180 }}
                  items={fileUsageItems}
                  name="fileUsage"
                  label={getString('filestore.view.fileUsage')}
                />
              </Container>
              <FooterRenderer
                type="submit"
                onCancel={close}
                confirmText={getString('create')}
                cancelText={getString('cancel')}
                loading={loading}
              />
            </Layout.Vertical>
          </Form>
        )
      }}
    </Formik>
  )
}

export default NewFileForm
