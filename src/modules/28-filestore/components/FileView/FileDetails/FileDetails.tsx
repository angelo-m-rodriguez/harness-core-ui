/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useContext, useEffect, useState } from 'react'
import { Button, Container, Formik, FormikForm, Layout, Text, Icon, ButtonVariation, useToaster } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { Spinner } from '@blueprintjs/core'
import { Color } from '@harness/design-system'

import { get } from 'lodash-es'
import type { ProjectPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import type { StringsMap } from 'stringTypes'

import { useStrings } from 'framework/strings'
import { useDownloadFile, useCreate, useUpdate } from 'services/cd-ng'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import useUploadFile, { UPLOAD_EVENTS } from '@filestore/common/useUpload/useUpload'
import {
  getFileUsageNameByType,
  getLanguageType,
  getFSErrorByType,
  checkSupportedMime
} from '@filestore/utils/textUtils'
import MonacoEditor from '@common/components/MonacoEditor/MonacoEditor'
import useNewNodeModal from '@filestore/common/useNewNodeModal/useNewNodeModal'
import { ExtensionType, FSErrosType, LanguageType } from '@filestore/utils/constants'
import WrongFormatView from './WrongFormatView'

import css from '../FileView.module.scss'

function FileDetails(): React.ReactElement {
  const fileStoreContext = useContext(FileStoreContext)
  const { currentNode, updateCurrentNode, isCachedNode } = fileStoreContext

  const [errorMessage, setErrorMessage] = useState('')
  const params = useParams<PipelineType<ProjectPathProps>>()
  const [value, setValue] = useState('')
  const [language, setLanguage] = useState<string>(LanguageType.TEXT)
  const [isUnsupported, setIsUnsupported] = useState<boolean>(false)
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()

  const nodeFormModal = useNewNodeModal({
    type: FileStoreNodeTypes.FILE,
    parentIdentifier: currentNode?.parentIdentifier ? currentNode.parentIdentifier : 'Root',
    tempNode: isCachedNode(currentNode.identifier),
    editMode: true,
    currentNode,
    fileStoreContext
  })

  const uploadNewFile = useUploadFile({
    isBtn: true,
    eventMethod: UPLOAD_EVENTS.REPLACE
  })

  const { accountId, orgIdentifier, projectIdentifier } = params

  useEffect(() => {
    if (isCachedNode(currentNode.identifier) && errorMessage === FSErrosType.UNSUPPORTED_FORMAT) {
      setIsUnsupported(true)
    } else {
      setIsUnsupported(false)
    }
  }, [errorMessage, isCachedNode, setIsUnsupported, currentNode])

  useEffect(() => {
    setErrorMessage('')
    if (currentNode.content && isCachedNode(currentNode.identifier)) {
      setValue(currentNode.content)
    }
    if (!currentNode.content) {
      setValue('')
    }
    if (currentNode?.mimeType) {
      if (!checkSupportedMime(currentNode.mimeType as ExtensionType)) {
        setErrorMessage(FSErrosType.UNSUPPORTED_FORMAT)
        return
      } else {
        setErrorMessage('')
      }
      setLanguage(getLanguageType(currentNode.mimeType))
    }
  }, [currentNode, setErrorMessage, isCachedNode])

  const { mutate: createNode } = useCreate({
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier }
  })

  const { data, loading: downloadLoading } = useDownloadFile({
    identifier: currentNode.identifier,
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    }
  })

  const { mutate: updateNode, loading: saveLoading } = useUpdate({
    identifier: currentNode.identifier,
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier }
  })

  const handleSubmit = async (values: any): Promise<void> => {
    if (!currentNode.fileUsage) {
      setErrorMessage(FSErrosType.FILE_USAGE)
      return
    }
    const formData = new FormData()

    const defaultMimeType = currentNode?.mimeType ? currentNode.mimeType : ExtensionType.TEXT

    formData.append('type', FileStoreNodeTypes.FILE)

    formData.append('content', values.fileEditor)
    formData.append('mimeType', defaultMimeType)
    formData.append('name', currentNode.name)
    formData.append('identifier', currentNode.identifier)
    formData.append('fileUsage', currentNode.fileUsage as string)
    formData.append('parentIdentifier', currentNode.parentIdentifier as string)
    try {
      if (!currentNode.tempNode) {
        const responseUpdate = await updateNode(formData as any)
        if (responseUpdate.status === 'SUCCESS') {
          showSuccess(getString('filestore.fileSuccessSaved', { name: currentNode.name }))
        }
      } else {
        const response = await createNode(formData as any)

        if (response.status === 'SUCCESS') {
          showSuccess(getString('filestore.fileSuccessCreated', { name: currentNode.name }))
        }
      }
    } catch (e) {
      showError(e.data.message)
    }
  }

  useEffect(() => {
    if (data && !isCachedNode(currentNode.identifier)) {
      ;(data as unknown as Response).text().then((content: string) => setValue(content))
    }
  }, [data, isCachedNode, currentNode.identifier])

  return (
    <Container style={{ width: '100%', height: 'calc(100% - 76px)' }} className={css.fileDetails}>
      {downloadLoading && !isCachedNode(currentNode.identifier) ? (
        <Container flex={{ justifyContent: 'center', alignItems: 'center' }} style={{ width: '100%', height: '100%' }}>
          <Spinner />
        </Container>
      ) : (
        <Formik
          enableReinitialize
          initialValues={{
            fileEditor: value
          }}
          formName="editor-file-store"
          onSubmit={values => {
            handleSubmit(values)
          }}
        >
          {formikProps => {
            return (
              <FormikForm>
                <Layout.Horizontal
                  className={css.fileEditPanel}
                  padding="medium"
                  flex={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Container
                    padding="small"
                    className={css.fileInfoContainer}
                    flex={{ justifyContent: 'space-between' }}
                  >
                    <Container
                      className={css.fileName}
                      flex={{ justifyContent: 'space-between', alignItems: 'center' }}
                      padding={{ right: 'small' }}
                    >
                      <Text
                        font={{ size: 'normal', weight: 'bold' }}
                        margin={{ right: 'small' }}
                        color={Color.GREY_1000}
                        tooltip={currentNode.name}
                        style={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {currentNode.name}
                      </Text>
                      <Icon name="file" />
                    </Container>
                    <Container padding={{ left: 'small' }} flex={{ justifyContent: 'space-between' }}>
                      <Container flex>
                        <Text>{getString('filestore.view.fileUsage')}:</Text>
                        <Text margin={{ left: 'small' }} color={Color.GREY_700}>
                          {currentNode?.fileUsage ? getFileUsageNameByType(currentNode.fileUsage) : 'Undefined'}
                        </Text>
                      </Container>
                      {!isUnsupported && (
                        <Icon
                          style={{ cursor: 'pointer' }}
                          name="Edit"
                          margin={{ left: 'medium' }}
                          onClick={() => {
                            updateCurrentNode({ ...currentNode, content: get(formikProps.values, 'fileEditor') })
                            nodeFormModal.onClick()
                          }}
                        />
                      )}
                    </Container>
                  </Container>
                  <Container flex>
                    {errorMessage && (
                      <Text margin={{ right: 'large' }} font={{ size: 'small' }} color={Color.ORANGE_900}>
                        {errorMessage && getString(getFSErrorByType(errorMessage as FSErrosType) as keyof StringsMap)}
                      </Text>
                    )}
                    {!isUnsupported && (
                      <>
                        <Button
                          type="submit"
                          variation={ButtonVariation.PRIMARY}
                          text={getString('save')}
                          disabled={!get(formikProps.values, 'fileEditor') || saveLoading}
                          loading={saveLoading}
                        />
                        <Button
                          margin={{ left: 'small', right: 'small' }}
                          variation={ButtonVariation.TERTIARY}
                          text={getString('cancel')}
                          onClick={() => updateCurrentNode({ ...currentNode, content: '' })}
                          disabled={saveLoading}
                        />
                      </>
                    )}
                    {isCachedNode(currentNode.identifier) && (
                      <Button
                        variation={ButtonVariation.SECONDARY}
                        icon="syncing"
                        onClick={uploadNewFile.onClick}
                        title={uploadNewFile.label}
                        text={uploadNewFile.label}
                        margin={{ left: 'small' }}
                      >
                        {uploadNewFile.ComponentRenderer}
                      </Button>
                    )}
                  </Container>
                </Layout.Horizontal>
                {!isUnsupported && (
                  <MonacoEditor
                    height={window.innerHeight - 218}
                    value={get(formikProps.values, 'fileEditor')}
                    language={language}
                    options={{
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: 14,
                      minimap: {
                        enabled: false
                      },
                      readOnly: false,
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      glyphMargin: false,
                      folding: false,
                      lineDecorationsWidth: 60,
                      wordWrap: 'on',
                      scrollbar: {
                        verticalScrollbarSize: 0
                      },
                      renderLineHighlight: 'none',
                      wordWrapBreakBeforeCharacters: '',
                      lineNumbersMinChars: 0
                    }}
                    onChange={txt => {
                      formikProps.setFieldValue('fileEditor', txt)
                    }}
                    {...({ name: 'testeditor' } as any)} // this is required for test cases
                  />
                )}
              </FormikForm>
            )
          }}
        </Formik>
      )}
      {isUnsupported && <WrongFormatView />}
    </Container>
  )
}

export default FileDetails
