/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import {
  Button,
  ButtonVariation,
  Container,
  Formik,
  FormikForm,
  FormInput,
  getErrorInfoFromErrorObject,
  Layout,
  SelectOption,
  Text,
  useToaster
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color, FontVariation } from '@harness/design-system'
import * as Yup from 'yup'
import { useStrings } from 'framework/strings'
import { useCreatePerspectiveFolder, useGetFolders, useMovePerspectives } from 'services/ce'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { folderViewType, moveFolderType } from '@ce/constants'
import { useQueryParams } from '@common/hooks'

const modalPropsLight: IDialogProps = {
  isOpen: true,
  enforceFocus: false,
  style: {
    position: 'relative',
    borderLeft: 0,
    paddingBottom: 0
  }
}

interface MoveModalProps extends ModalProps {
  hideModal: () => void
}

interface FormValues {
  folderType: string
  folderName?: string
  selectedFolder?: string
}

interface ModalProps {
  perspectiveId: string
  setRefetchFolders: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedFolder: (newState: string) => void
  setRefetchPerspectives: React.Dispatch<React.SetStateAction<boolean>>
}

export const MovePerspectivesModal: React.FC<MoveModalProps> = ({
  hideModal,
  perspectiveId,
  setRefetchFolders,
  setSelectedFolder,
  setRefetchPerspectives
}) => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const { showError, showSuccess } = useToaster()
  let { folderId } = useQueryParams<{ folderId: string }>()
  folderId = folderId && JSON.parse(folderId)
  const folderOptions: SelectOption[] = []

  const { data: foldersListResullt } = useGetFolders({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const foldersList = foldersListResullt?.data || /* istanbul ignore next */ []
  const currentFolder = foldersList.find(item =>
    folderId ? /* istanbul ignore next */ item.uuid === folderId : item.viewType === folderViewType.DEFAULT
  )

  const { mutate: createFolder } = useCreatePerspectiveFolder({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: moveFolder } = useMovePerspectives({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const handleSubmit: (data: FormValues) => any = async data => {
    try {
      if (data.folderType === moveFolderType.EXISTING) {
        await moveFolder({
          newFolderId: data.selectedFolder,
          perspectiveIds: [perspectiveId]
        })

        showSuccess(getString('ce.perspectives.folders.folderMoved'))
        setRefetchPerspectives(true)
      } else {
        const response = await createFolder({
          ceViewFolder: {
            name: data.folderName
          },
          perspectiveIds: [perspectiveId]
        })

        showSuccess(getString('ce.perspectives.folders.folderCreated'))
        setRefetchFolders(true)
        setSelectedFolder(response.data?.uuid || '')
      }

      hideModal()
    } catch (error) {
      showError(getErrorInfoFromErrorObject(error))
    }
  }

  foldersList.forEach(item => {
    if (item.viewType !== folderViewType.SAMPLE) {
      folderOptions.push({
        label: item.name || /* istanbul ignore next */ '',
        value: item.uuid || /* istanbul ignore next */ ''
      })
    }
  })

  return (
    <Dialog
      onClose={hideModal}
      {...modalPropsLight}
      canOutsideClickClose={true}
      title={getString('ce.perspectives.folders.moveFolderTitle')}
    >
      <Formik
        onSubmit={data => handleSubmit(data)}
        formName={'moveFolder'}
        initialValues={{ folderType: moveFolderType.EXISTING, folderName: '', selectedFolder: '' }}
        validationSchema={Yup.object().shape({
          folderType: Yup.string().required(),
          folderName: Yup.string().when('folderType', {
            is: valueType => valueType === moveFolderType.NEW,
            then: Yup.string().required(getString('ce.perspectives.folders.folderNameRequired')),
            otherwise: Yup.string().nullable()
          }),
          selectedFolder: Yup.string().when('folderType', {
            is: valueType => valueType === moveFolderType.EXISTING,
            then: Yup.string().required(getString('ce.perspectives.folders.folderSelectionRequired')),
            otherwise: Yup.string().nullable()
          })
        })}
      >
        {formikProps => {
          return (
            <Container padding="xlarge">
              <FormikForm>
                <Layout.Vertical>
                  <Text font={{ variation: FontVariation.BODY2 }} padding={{ bottom: 'small' }} color={Color.GREY_700}>
                    {getString('ce.perspectives.folders.currentFolderLabel')}
                  </Text>
                  <Text
                    icon={'main-folder'}
                    font={{ variation: FontVariation.BODY }}
                    padding={{ bottom: 'xlarge' }}
                    color={Color.GREY_700}
                  >
                    {currentFolder?.name || /* istanbul ignore next */ ''}
                  </Text>
                  <FormInput.RadioGroup
                    name="folderType"
                    radioGroup={{ inline: true }}
                    items={[
                      {
                        label: getString('ce.perspectives.folders.moveExistingFolder'),
                        value: moveFolderType.EXISTING
                      },
                      {
                        label: getString('ce.perspectives.folders.createNewFolder'),
                        value: moveFolderType.NEW
                      }
                    ]}
                  />
                  {formikProps.values.folderType === moveFolderType.EXISTING ? (
                    <FormInput.Select
                      name={'selectedFolder'}
                      items={folderOptions}
                      label={getString('ce.perspectives.folders.moveToLabel')}
                    />
                  ) : (
                    /* istanbul ignore next */ <FormInput.Text
                      name={'folderName'}
                      label={getString('ce.perspectives.folders.folderNameLabel')}
                      placeholder={getString('ce.perspectives.folders.folderNamePlaceholder')}
                    />
                  )}
                </Layout.Vertical>
                <Layout.Horizontal spacing="medium" margin={{ top: 'xlarge' }}>
                  <Button
                    text={getString('save')}
                    type="submit"
                    variation={ButtonVariation.PRIMARY}
                    data-testid="moveFolder"
                  />
                  <Button variation={ButtonVariation.TERTIARY} onClick={hideModal} text={getString('cancel')} />
                </Layout.Horizontal>
              </FormikForm>
            </Container>
          )
        }}
      </Formik>
    </Dialog>
  )
}

const useMoveFolderModal = (props: ModalProps) => {
  const [openModal, hideModal] = useModalHook(
    () => (
      <MovePerspectivesModal
        hideModal={hideModal}
        perspectiveId={props.perspectiveId}
        setRefetchFolders={props.setRefetchFolders}
        setSelectedFolder={props.setSelectedFolder}
        setRefetchPerspectives={props.setRefetchPerspectives}
      />
    ),
    []
  )
  return {
    openMoveFoldersModal: openModal
  }
}

export default useMoveFolderModal
