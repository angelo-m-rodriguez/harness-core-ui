/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import {
  Button,
  ButtonVariation,
  Checkbox,
  Container,
  ExpandingSearchInput,
  Formik,
  FormikForm,
  FormInput,
  getErrorInfoFromErrorObject,
  Layout,
  Text,
  useToaster
} from '@harness/uicore'
import * as Yup from 'yup'
import { useModalHook } from '@harness/use-modal'
import { Color, FontVariation } from '@harness/design-system'
import { defaultTo } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { useCreatePerspectiveFolder } from 'services/ce'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { QlceSortOrder, QlceView, QlceViewSortType, useFetchAllPerspectivesQuery } from 'services/ce/services'
import { searchList } from '@ce/utils/perspectiveUtils'
import css from './PerspectiveFoldersSideNav.module.scss'

const modalPropsLight: IDialogProps = {
  isOpen: true,
  enforceFocus: false,
  style: {
    position: 'relative',
    borderLeft: 0,
    paddingBottom: 0
  }
}

interface CreateModalProps {
  hideModal: () => void
  perspectives: QlceView[]
  setRefetchFolders: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedFolder: (newState: string) => void
}

interface FormValues {
  folderName: string
}

interface CreateFolderProps {
  defaultFolderId: string
  setRefetchFolders: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedFolder: (newState: string) => void
}

export const CreateModal: React.FC<CreateModalProps> = ({
  hideModal,
  perspectives,
  setRefetchFolders,
  setSelectedFolder
}) => {
  const { getString } = useStrings()
  const [perspectiveList, setPerspectiveList] = useState(perspectives)
  const [selectedPerspectives, setSelectedPerspective] = useState<string[]>([])
  const { accountId } = useParams<AccountPathProps>()
  const { showError, showSuccess } = useToaster()

  const { mutate: createFolder } = useCreatePerspectiveFolder({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const handleSubmit: (data: FormValues) => any = async data => {
    try {
      const response = await createFolder({
        ceViewFolder: {
          name: data.folderName
        },
        perspectiveIds: selectedPerspectives
      })

      showSuccess(getString('ce.perspectives.folders.folderCreated'))
      setRefetchFolders(true)
      setSelectedFolder(response.data?.uuid || '')
      hideModal()
    } catch (error) {
      showError(getErrorInfoFromErrorObject(error))
    }
  }

  const onSearch = (searchVal: string) => {
    const filteredList = searchList(searchVal, perspectives)
    setPerspectiveList(filteredList)
  }

  const onChange = (perspectiveId: string, checked: boolean) => {
    const alreadySelected: string[] = [...selectedPerspectives]
    if (checked) {
      alreadySelected.push(perspectiveId)
      setSelectedPerspective(alreadySelected)
    } else {
      const selectedIndex = alreadySelected.indexOf(perspectiveId)
      alreadySelected.splice(selectedIndex, 1)
      setSelectedPerspective(alreadySelected)
    }
  }

  return (
    <Dialog
      onClose={hideModal}
      {...modalPropsLight}
      canOutsideClickClose={true}
      title={getString('ce.perspectives.folders.createNewFolderHeading')}
    >
      <Formik
        onSubmit={data => handleSubmit(data)}
        formName={'createFolder'}
        initialValues={{ folderName: '' }}
        validationSchema={Yup.object().shape({
          folderName: Yup.string()
            .trim()
            .required(getString('ce.perspectives.folders.folderNameRequired'))
            .min(1, getString('ce.perspectives.createPerspective.validationErrors.nameLengthError'))
            .max(80, getString('ce.perspectives.createPerspective.validationErrors.nameLengthError'))
        })}
      >
        {formikProps => {
          return (
            <Container padding="xlarge">
              <FormikForm>
                <FormInput.Text
                  name={'folderName'}
                  label={getString('name')}
                  placeholder={getString('ce.perspectives.folders.folderNamePlaceholder')}
                />
                <Text color={Color.GREY_600} font={{ variation: FontVariation.BODY2 }} padding={{ bottom: 'small' }}>
                  {getString('ce.perspectives.folders.selectPerspectiveLabel')}
                </Text>
                <Layout.Vertical className={css.perpectiveSearchWrapper}>
                  <ExpandingSearchInput
                    onChange={text => onSearch(text.trim())}
                    alwaysExpanded={true}
                    placeholder={getString('search')}
                  />
                  <Layout.Vertical className={css.perspectiveListWrapper}>
                    {perspectiveList.map(data => {
                      if (data.id) {
                        return (
                          <Checkbox
                            key={data.id}
                            label={data.name as string}
                            className={css.checkbox}
                            checked={selectedPerspectives.includes(data.id)}
                            onChange={(event: React.FormEvent<HTMLInputElement>) => {
                              onChange(data.id || '', event.currentTarget.checked)
                            }}
                            data-testid={'perspectiveSelection'}
                          />
                        )
                      }
                      return null
                    })}
                  </Layout.Vertical>
                </Layout.Vertical>
                <Layout.Horizontal spacing="medium">
                  <Button
                    text={getString('save')}
                    type="submit"
                    variation={ButtonVariation.PRIMARY}
                    disabled={!formikProps.values.folderName.trim()}
                    data-testid="createFolder"
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

const useCreateFolderModal = (props: CreateFolderProps) => {
  const [result] = useFetchAllPerspectivesQuery({
    variables: {
      folderId: props.defaultFolderId,
      sortCriteria: { sortOrder: QlceSortOrder.Ascending, sortType: QlceViewSortType.Name }
    }
  })
  const { data } = result

  const perspectiveList = defaultTo(data?.perspectives?.customerViews, []) as QlceView[]

  const [openModal, hideModal] = useModalHook(
    () => (
      <CreateModal
        hideModal={hideModal}
        perspectives={perspectiveList}
        setRefetchFolders={props.setRefetchFolders}
        setSelectedFolder={props.setSelectedFolder}
      />
    ),
    [perspectiveList]
  )
  return {
    openCreateFoldersModal: openModal
  }
}

export default useCreateFolderModal
