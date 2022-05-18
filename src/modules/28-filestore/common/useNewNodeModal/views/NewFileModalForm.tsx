/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
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
import { useCreate, useUpdate } from 'services/cd-ng'
import { getFileUsageNameByType, getMimeTypeByName } from '@filestore/utils/textUtils'
import { FileStoreNodeTypes, FileUsage, NewFileDTO, NewFileFormDTO } from '@filestore/interfaces/FileStore'
import type { FileStoreContextState, FileStoreNodeDTO } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FILE_STORE_ROOT } from '@filestore/utils/constants'

interface NewFileModalData {
  data?: NewFileDTO
  editMode?: boolean
  onSubmit?: (resourceGroup: NewFileDTO) => void
  close: () => void
  parentIdentifier: string
  tempNode?: FileStoreNodeDTO | undefined
  fileStoreContext: FileStoreContextState
}

const NewFileForm: React.FC<NewFileModalData> = props => {
  const { close, editMode = false, tempNode, fileStoreContext } = props
  const { currentNode, updateCurrentNode, removeFromTempNodes, getNode } = fileStoreContext
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [initialValues, setInitialValues] = useState<Omit<NewFileDTO, 'type'>>({
    name: '',
    description: '',
    identifier: '',
    fileUsage: null,
    content: '',
    tags: []
  })

  useEffect(() => {
    if (currentNode && editMode) {
      setInitialValues({
        name: currentNode.name,
        description: currentNode?.description || '',
        identifier: currentNode.identifier,
        fileUsage: currentNode.fileUsage as string,
        content: currentNode.content,
        tags: currentNode.tags
      })
    }
  }, [currentNode, editMode])

  const { mutate: createFile, loading: createLoading } = useCreate({
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier }
  })
  const { mutate: updateNode, loading: updateLoading } = useUpdate({
    identifier: currentNode.identifier,
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier }
  })

  const { getString } = useStrings()
  const { showSuccess } = useToaster()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()

  const handleSubmit = async (values: any): Promise<void> => {
    const data = new FormData()
    Object.keys(values).forEach(prop => {
      if (prop === 'tags') {
        return
      }
      data.append(prop, values[prop])
    })
    data.append('type', FileStoreNodeTypes.FILE)

    if (currentNode?.parentIdentifier && currentNode.type !== FileStoreNodeTypes.FOLDER) {
      data.append('parentIdentifier', currentNode.parentIdentifier)
    } else {
      data.append('parentIdentifier', currentNode.identifier)
    }

    data.append('mimeType', getMimeTypeByName(values.name))
    try {
      if (!tempNode && editMode) {
        const { data: updateResponse, status } = await updateNode(data as any)
        if (status === 'SUCCESS' && updateResponse) {
          showSuccess(getString('filestore.fileSuccessSaved', { name: values.name }))
          updateCurrentNode({
            ...currentNode,
            ...(updateResponse as FileStoreNodeDTO)
          })
          close()
        }
      } else {
        const response = await createFile(data as any)
        if (response.status === 'SUCCESS') {
          if (tempNode) {
            showSuccess(getString('filestore.fileSuccessCreated', { name: values.name }))
            removeFromTempNodes(currentNode.identifier)

            getNode(
              {
                identifier: currentNode.parentIdentifier || FILE_STORE_ROOT,
                name: currentNode?.parentName ? currentNode.parentName : '',
                type: FileStoreNodeTypes.FOLDER
              },
              {
                setNewCurrentNode: true,
                type: FileStoreNodeTypes.FILE,
                identifier: values.identifier
              }
            )
            close()
          } else {
            try {
              getNode(
                {
                  identifier: currentNode.identifier || FILE_STORE_ROOT,
                  name: currentNode.name,
                  type: FileStoreNodeTypes.FOLDER
                },
                {
                  setNewCurrentNode: true,
                  type: FileStoreNodeTypes.FILE,
                  identifier: values.identifier
                }
              )
              showSuccess(getString('filestore.fileSuccessCreated', { name: values.name }))
              close()
            } catch (e) {
              modalErrorHandler?.showDanger(e.data.message)
            }
          }
        }
      }
    } catch (e) {
      modalErrorHandler?.showDanger(e.data.message)
    }
  }

  const fileUsageItems = React.useMemo(() => {
    return Object.values(FileUsage).map((fs: FileUsage) => ({
      label: getFileUsageNameByType(fs),
      value: fs
    }))
  }, [])

  return (
    <Formik<NewFileFormDTO>
      enableReinitialize
      initialValues={initialValues}
      formName="newFile"
      validationSchema={Yup.object().shape({
        identifier: IdentifierSchema(),
        fileUsage: NameSchema({ requiredErrorMsg: 'File Usage is require' })
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
                <NameIdDescriptionTags
                  formikProps={formikProps}
                  identifierProps={{
                    isIdentifierEditable: !editMode || !!tempNode
                  }}
                />
                <FormInput.Select
                  style={{ width: 180 }}
                  items={fileUsageItems}
                  name="fileUsage"
                  label={getString('filestore.view.fileUsage')}
                  onChange={e => {
                    fileStoreContext?.updateCurrentNode({
                      ...fileStoreContext.currentNode,
                      fileUsage: e.value as FileUsage
                    })
                  }}
                />
              </Container>
              <FooterRenderer
                type="submit"
                onCancel={close}
                confirmText={editMode ? getString('save') : getString('create')}
                cancelText={getString('cancel')}
                loading={editMode ? updateLoading : createLoading}
              />
            </Layout.Vertical>
          </Form>
        )
      }}
    </Formik>
  )
}

export default NewFileForm
