/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  ButtonVariation,
  Container,
  Icon,
  IconName,
  Layout,
  Text,
  useConfirmationDialog
} from '@harness/uicore'
import { Color, FontVariation, Intent } from '@harness/design-system'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { CEViewFolder } from 'services/ce'
import { folderViewType } from '@ce/constants'
import useCreateFolderModal from './CreateFolderModal'
import css from './PerspectiveFoldersSideNav.module.scss'

interface SideNavProps {
  setSelectedFolder: (newState: string) => void
  selectedFolderId: string
  foldersList: CEViewFolder[]
  setRefetchFolders: React.Dispatch<React.SetStateAction<boolean>>
  foldersLoading: boolean
  defaultFolderId: string
  deleteFolder: (id: string) => void
}

interface SidebarLinkProps {
  label: string | undefined
  icon?: IconName
  className?: string
  textClassName?: string
  folderId: string | undefined
  showIcons?: boolean
  selectedFolderId: string
  setSelectedFolder: (newState: string) => void
  onDelete: (id: string) => void
}

const renderLoader = (): JSX.Element => {
  return (
    <Container className={css.loader} data-testid="loader">
      <Icon name="spinner" color={Color.BLUE_500} size={30} />
    </Container>
  )
}

const SideNavItem: React.FC<SidebarLinkProps> = ({
  selectedFolderId,
  setSelectedFolder,
  icon,
  textClassName,
  onDelete,
  folderId = '',
  label = '',
  showIcons = true
}) => {
  return (
    <li
      className={cx(css.link, selectedFolderId === folderId ? css.active : '')}
      onClick={() => setSelectedFolder(folderId)}
    >
      <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
        <Text
          icon={icon}
          font={{ variation: FontVariation.BODY }}
          color={Color.GREY_700}
          className={textClassName}
          lineClamp={1}
          style={{ maxWidth: 200 }}
        >
          {label}
        </Text>
        {showIcons && (
          <Icon
            name="main-trash"
            size={16}
            color={Color.PRIMARY_6}
            onClick={() => onDelete(folderId)}
            className={css.icon}
            data-testid={'deleteFolder'}
          />
        )}
      </Layout.Horizontal>
    </li>
  )
}

const PerspectiveFoldersSideNav: React.FC<SideNavProps> = props => {
  const { getString } = useStrings()
  const { openCreateFoldersModal } = useCreateFolderModal({
    defaultFolderId: props.defaultFolderId,
    setRefetchFolders: props.setRefetchFolders,
    setSelectedFolder: props.setSelectedFolder
  })
  const [deleteFolderId, setDeleteFolderId] = useState('')
  const defaultFolders: CEViewFolder[] = props.foldersList.filter(
    item => item.viewType === folderViewType.DEFAULT || item.viewType === folderViewType.SAMPLE
  )
  const customFolders: CEViewFolder[] = props.foldersList.filter(item => item.viewType === folderViewType.CUSTOMER)

  const onDelete = (folderId: string) => {
    setDeleteFolderId(folderId)
    openDeleteDialog()
  }

  const { openDialog: openDeleteDialog } = useConfirmationDialog({
    contentText: <Text>{getString('ce.perspectives.folders.deletedConfirmationDesc')}</Text>,
    titleText: getString('ce.perspectives.folders.deletedConfirmationTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        props.deleteFolder(deleteFolderId)
      }
    }
  })

  return (
    <Layout.Vertical spacing={'small'} className={css.sidenavWrapper}>
      {props.foldersLoading ? (
        renderLoader()
      ) : (
        <>
          <Text
            color={Color.GREY_800}
            font={{ variation: FontVariation.H6 }}
            padding={{ top: 'xlarge', left: 'xxlarge' }}
          >
            {getString('ce.perspectives.folders.heading')}
          </Text>
          <ul className={css.foldersList}>
            {defaultFolders.map(item => {
              return (
                <SideNavItem
                  key={item.uuid}
                  label={item.name}
                  icon={
                    item.viewType === folderViewType.SAMPLE
                      ? 'harness-with-color'
                      : props.selectedFolderId === item.uuid
                      ? 'main-folder-open'
                      : 'main-folder'
                  }
                  className={css.sidenav}
                  textClassName={css.sidenavText}
                  folderId={item.uuid}
                  showIcons={false}
                  selectedFolderId={props.selectedFolderId}
                  setSelectedFolder={props.setSelectedFolder}
                  onDelete={onDelete}
                />
              )
            })}
          </ul>
          <Container className={css.customFoldersNav}>
            <Text
              color={Color.GREY_700}
              font={{ variation: FontVariation.BODY }}
              border={{ bottom: true }}
              padding={{ bottom: 'xsmall' }}
            >
              {getString('ce.perspectives.folders.customFolders')}
            </Text>
            <Button
              icon="plus"
              onClick={openCreateFoldersModal}
              text={getString('ce.perspectives.folders.newFolder')}
              variation={ButtonVariation.LINK}
              style={{ justifyContent: 'flex-start', paddingLeft: 0, paddingTop: 'var(--spacing-small)' }}
            />
          </Container>
          <ul className={css.foldersList}>
            {customFolders.map(item => {
              return (
                <SideNavItem
                  key={item.uuid}
                  label={item.name}
                  icon={
                    props.selectedFolderId === item.uuid ? /* istanbul ignore next */ 'main-folder-open' : 'main-folder'
                  }
                  className={css.sidenav}
                  textClassName={css.sidenavText}
                  folderId={item.uuid}
                  selectedFolderId={props.selectedFolderId}
                  setSelectedFolder={props.setSelectedFolder}
                  onDelete={onDelete}
                />
              )
            })}
          </ul>
        </>
      )}
    </Layout.Vertical>
  )
}

export default PerspectiveFoldersSideNav
