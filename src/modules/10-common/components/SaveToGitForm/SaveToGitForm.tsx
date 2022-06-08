/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Popover, Position } from '@blueprintjs/core'
import {
  Container,
  Text,
  Layout,
  Formik,
  FormikForm,
  FormInput,
  Button,
  SelectOption,
  Radio,
  Icon,
  Avatar,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  PageSpinner
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import * as Yup from 'yup'
import { debounce, isEmpty, pick, defaultTo } from 'lodash-es'
import type { FormikContextType } from 'formik'
import { Link } from 'react-router-dom'
import {
  GitSyncConfig,
  GitSyncEntityDTO,
  GitSyncFolderConfigDTO,
  EntityGitDetails,
  GitBranchDTO,
  getListOfBranchesWithStatusPromise,
  ResponseGitBranchListDTO
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { useGitSyncStore } from 'framework/GitRepoStore/GitSyncStoreContext'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import type { StoreMetadata } from '@common/constants/GitSyncTypes'
import { getEntityNameFromType } from '@common/utils/StringUtils'
import paths from '@common/RouteDefinitions'
import { validateFilePath } from '@common/utils/gitSyncUtils'
import { NameId } from '../NameIdDescriptionTags/NameIdDescriptionTags'
import css from './SaveToGitForm.module.scss'

export interface GitResourceInterface {
  type: GitSyncEntityDTO['entityType']
  name: string
  identifier: string
  gitDetails?: EntityGitDetails
  storeMetadata?: StoreMetadata
}

interface SaveToGitFormProps {
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  isEditing: boolean
  resource: GitResourceInterface
}

interface ModalConfigureProps {
  onClose?: () => void
  onSuccess?: (data: SaveToGitFormInterface) => void
}

export interface SaveToGitFormInterface {
  name?: string
  identifier?: string
  repoIdentifier?: string
  repoName?: string
  rootFolder?: string
  filePath?: string
  isNewBranch: boolean
  branch: string
  targetBranch?: string
  commitMsg: string
  createPr: boolean
}

const SaveToGitForm: React.FC<ModalConfigureProps & SaveToGitFormProps> = props => {
  const { accountId, projectIdentifier, orgIdentifier, isEditing = false, resource } = props
  const { getString } = useStrings()
  const { currentUserInfo: currentLoggedInUser } = useAppStore()
  const { gitSyncRepos, loadingRepos, codeManagers, loadingCodeManagers } = useGitSyncStore()
  const [rootFolderSelectOptions, setRootFolderSelectOptions] = React.useState<SelectOption[]>([])
  const [repoSelectOptions, setRepoSelectOptions] = React.useState<SelectOption[]>([])
  const [isNewBranch, setIsNewBranch] = React.useState(false)
  const [currentUserInfo, setCurrentUserInfo] = React.useState('')
  const [branches, setBranches] = React.useState<SelectOption[]>()
  const [modalErrorHandler, setModalErrorHandler] = React.useState<ModalErrorHandlerBinding>()
  const formikRef = useRef<FormikContextType<SaveToGitFormInterface>>()
  const [disableCreatePR, setDisableCreatePR] = useState<boolean>()
  const [showCreatePRWarning, setShowCreatePRWarning] = useState<boolean>(false)
  const [disableBranchSelection, setDisableBranchSelection] = useState<boolean>(true)

  const defaultInitialFormData: SaveToGitFormInterface = {
    name: resource.name,
    identifier: resource.identifier,
    repoIdentifier: defaultTo(resource.gitDetails?.repoIdentifier, ''),
    rootFolder: defaultTo(resource.gitDetails?.rootFolder, ''),
    filePath: defaultTo(resource.gitDetails?.filePath, `${resource.identifier}.yaml`),
    isNewBranch: false,
    branch: defaultTo(resource.gitDetails?.branch, ''),
    commitMsg: getString(isEditing ? 'common.gitSync.updateResource' : 'common.gitSync.createResource', {
      name: resource.name,
      type: getEntityNameFromType(resource.type)
    }),

    createPr: false,
    targetBranch: ''
  }

  useEffect(() => {
    setCurrentUserInfo(
      defaultTo(
        codeManagers?.[0]?.authentication?.spec?.spec?.username,
        codeManagers?.[0]?.authentication?.spec?.spec?.usernameRef
      )
    )
  }, [codeManagers])

  const handleBranchTypeChange = (isNew: boolean, formik: FormikContextType<SaveToGitFormInterface>): void => {
    if (isNewBranch !== isNew) {
      setIsNewBranch(isNew)
      formik.setFieldValue('branch', `${resource.gitDetails?.branch}-patch`)
      formik.setFieldTouched('branch', false)
    }
    formik.setFieldValue('targetBranch', isNew ? resource.gitDetails?.branch || '' : '')
    formik.setFieldTouched('targetBranch', false)
    formik.setFieldValue('createPr', false)
    formik.setFieldTouched('createPr', false)
    setDisableCreatePR(false)
    setDisableBranchSelection(true)
  }

  const getRootFolderSelectOptions = (folders: GitSyncFolderConfigDTO[] | undefined): SelectOption[] => {
    return folders?.length
      ? folders.map((folder: GitSyncFolderConfigDTO) => {
          return {
            label: defaultTo(folder.rootFolder, ''),
            value: defaultTo(folder.rootFolder, '')
          }
        })
      : []
  }

  useEffect(() => {
    if (projectIdentifier && gitSyncRepos?.length) {
      defaultInitialFormData.repoIdentifier = defaultInitialFormData.repoIdentifier || gitSyncRepos[0].identifier || ''
      const selectedRepo = gitSyncRepos.find(
        (repo: GitSyncConfig) => repo.identifier === defaultInitialFormData.repoIdentifier
      )

      setRepoSelectOptions(
        gitSyncRepos?.map((gitRepo: GitSyncConfig) => {
          return {
            label: defaultTo(gitRepo.name, ''),
            value: defaultTo(gitRepo.identifier, '')
          }
        })
      )

      setRootFolderSelectOptions(getRootFolderSelectOptions(selectedRepo?.gitSyncFolderConfigDTOs))

      const defaultRootFolder = selectedRepo?.gitSyncFolderConfigDTOs?.find(
        (folder: GitSyncFolderConfigDTO) => folder.isDefault
      )
      defaultInitialFormData.rootFolder = defaultInitialFormData.rootFolder || defaultRootFolder?.rootFolder || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gitSyncRepos, projectIdentifier])

  const fetchBranches = (query?: string): void => {
    getListOfBranchesWithStatusPromise({
      queryParams: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier,
        yamlGitConfigIdentifier: resource.gitDetails?.repoIdentifier || '',
        page: 0,
        size: 10,
        searchTerm: query
      }
    })
      .then((response: ResponseGitBranchListDTO) => {
        const branchesInResponse = response?.data?.branches?.content
        /* Show error in case no branches exist on a git repo at all */
        /* A valid git repo should have atleast one branch in it(a.k.a default branch) */
        if (!query && isEmpty(branchesInResponse)) {
          setDisableCreatePR(true)
          setDisableBranchSelection(true)
          modalErrorHandler?.showDanger(getString('common.git.noBranchesFound'))
          return
        }
        setShowCreatePRWarning(false)
        const branchOptions = branchesInResponse?.map((branch: GitBranchDTO) => {
          return { label: branch?.branchName, value: branch?.branchName }
        }) as SelectOption[]
        const filteredBranches = isNewBranch
          ? branchOptions
          : /* filter out current working branch from list of branches for commit to default branch use-case
               since PR from a branch to itself is not allowed */
            branchOptions?.filter((branch: SelectOption) => branch.value !== resource.gitDetails?.branch)
        if (!isNewBranch && isEmpty(filteredBranches)) {
          setDisableCreatePR(true)
          setDisableBranchSelection(true)
          setShowCreatePRWarning(true)
        } else {
          setBranches(filteredBranches)
          setDisableCreatePR(false)
          setDisableBranchSelection(false)
        }
      })
      .catch(e => {
        /* istanbul ignore next */ modalErrorHandler?.showDanger(e.data?.message || e.message)
      })
  }

  const debounceFetchBranches = debounce((query?: string): void => {
    try {
      fetchBranches(query)
    } catch (e) {
      /* istanbul ignore next */ modalErrorHandler?.showDanger(e.data?.message || e.message)
    }
  }, 1000)

  const CreatePR = React.useMemo(() => {
    return (
      <Layout.Horizontal flex={{ alignItems: 'baseline', justifyContent: 'flex-start' }} padding={{ top: 'small' }}>
        <FormInput.CheckBox
          disabled={formikRef.current?.values.createPr ? false : disableCreatePR}
          name="createPr"
          label={getString('common.git.startPRLabel')}
          onChange={e => {
            formikRef.current?.setFieldValue('createPr', e.currentTarget.checked)
            if (e.currentTarget.checked) {
              fetchBranches()
            } else {
              setDisableBranchSelection(true)
              setShowCreatePRWarning(false)
            }
          }}
        />
        {showCreatePRWarning ? (
          <Popover
            position={Position.TOP}
            content={
              <Text padding="medium" color={Color.RED_400}>
                {getString('common.git.onlyDefaultBranchFound')}
              </Text>
            }
            isOpen={showCreatePRWarning}
            popoverClassName={css.tooltip}
          >
            <Container margin={{ bottom: 'xlarge' }}></Container>
          </Popover>
        ) : null}
        <FormInput.Select
          name="targetBranch"
          items={defaultTo(branches, [])}
          disabled={disableBranchSelection || disableCreatePR}
          data-id="create-pr-branch-select"
          onQueryChange={(query: string) => debounceFetchBranches(query)}
          selectProps={{ usePortal: true, popoverClassName: css.gitBranchSelectorPopover }}
          className={css.branchSelector}
        />
      </Layout.Horizontal>
    )
  }, [disableCreatePR, disableBranchSelection, branches, isNewBranch, formikRef.current?.values, showCreatePRWarning])

  return loadingRepos ? (
    <PageSpinner />
  ) : (
    <Container height={'inherit'} className={css.modalContainer}>
      <ModalErrorHandler bind={setModalErrorHandler} />
      {currentUserInfo && (
        <Layout.Horizontal className={css.userInfo} flex={{ alignItems: 'center' }} margin={{ top: 'xsmall' }}>
          <Avatar size="small" name={currentLoggedInUser.name} backgroundColor={Color.PRIMARY_7} hoverCard={false} />
          <Text color={Color.GREY_700}>
            {getString('common.git.currentUserLabel', { user: currentLoggedInUser.name })}
          </Text>
        </Layout.Horizontal>
      )}
      <Text
        className={css.modalHeader}
        font={{ weight: 'semi-bold' }}
        color={Color.GREY_800}
        padding={{ bottom: 'small' }}
        margin={{ bottom: 'small', top: 'xlarge' }}
      >
        {getString('common.git.saveResourceLabel', { resource: props.resource.type })}
      </Text>
      {!loadingCodeManagers && !currentUserInfo && (
        <Layout.Horizontal className={css.addUserContainer} spacing="small">
          <Icon name="warning-sign" color={Color.ORANGE_700}></Icon>
          <div>
            <Text font={{ size: 'small' }} color={Color.BLACK}>
              {getString('common.git.noUserLabel')}
            </Text>
            <Link to={paths.toUserProfile({ accountId })} target="_blank" onClick={() => props.onClose?.()}>
              <Text inline margin={{ top: 'xsmall' }} font={{ size: 'small', weight: 'bold' }} color={Color.PRIMARY_7}>
                {getString('common.git.addUserCredentialLabel')}
              </Text>
            </Link>
          </div>
        </Layout.Horizontal>
      )}
      <Container className={css.modalBody}>
        <Formik<SaveToGitFormInterface>
          initialValues={defaultInitialFormData}
          formName="saveToGitForm"
          validationSchema={Yup.object().shape({
            repoIdentifier: Yup.string().trim().required(getString('common.validation.repositoryName')),
            filePath: Yup.string()
              .trim()
              .required(getString('common.git.validation.filePath'))
              .test('filePath', getString('common.validation.yamlFilePath'), validateFilePath),
            branch: Yup.string()
              .trim()
              .required(getString('validation.branchName'))
              .when('createPr', {
                is: true,
                then: Yup.string().notOneOf([Yup.ref('targetBranch')], getString('common.git.validation.sameBranches'))
              }),
            targetBranch: Yup.string()
              .trim()
              .when('createPr', {
                is: true,
                then: Yup.string().required(getString('common.git.validation.targetBranch'))
              }),
            commitMsg: Yup.string().trim().min(1).required(getString('common.git.validation.commitMessage'))
          })}
          onSubmit={formData => {
            props.onSuccess?.({
              ...pick(formData, ['repoIdentifier', 'rootFolder', 'filePath', 'commitMsg', 'createPr', 'targetBranch']),
              isNewBranch,
              branch: isNewBranch ? formData.branch : defaultInitialFormData.branch
            })
          }}
        >
          {formik => {
            formikRef.current = formik
            return (
              <FormikForm>
                <Container className={css.formBody}>
                  <NameId
                    identifierProps={{
                      inputName: 'name',
                      isIdentifierEditable: false,
                      inputGroupProps: { disabled: true }
                    }}
                  />
                  <Text margin={{ bottom: 'small' }} font={{ size: 'medium' }} color={Color.GREY_700}>
                    {getString('common.gitSync.harnessFolderLabel')}
                  </Text>
                  <Layout.Horizontal spacing="medium" className={css.formRow}>
                    <FormInput.Select
                      name="repoIdentifier"
                      label={getString('common.git.selectRepoLabel')}
                      items={repoSelectOptions}
                      disabled
                    />
                    <FormInput.Select
                      name="rootFolder"
                      label={getString('common.gitSync.harnessFolderLabel')}
                      items={rootFolderSelectOptions}
                      disabled={isEditing}
                    />
                  </Layout.Horizontal>

                  <FormInput.Text name="filePath" label={getString('common.git.filePath')} disabled={isEditing} />
                  <Text margin={{ bottom: 'small', top: 'large' }} font={{ size: 'medium' }} color={Color.GREY_700}>
                    {getString('common.gitSync.commitDetailsLabel')}
                  </Text>
                  <FormInput.TextArea name="commitMsg" label={getString('common.git.commitMessage')} />

                  <Text
                    font={{ size: 'medium' }}
                    color={Color.GREY_600}
                    padding={{ bottom: 'small' }}
                    margin={{ top: 'large' }}
                  >
                    {getString('common.git.branchSelectHeader')}
                  </Text>
                  <Layout.Vertical spacing="medium">
                    <Container
                      className={css.branchSection}
                      padding={{
                        top: 'small',
                        bottom: 'xSmall'
                      }}
                    >
                      <Radio large onChange={() => handleBranchTypeChange(false, formik)} checked={!isNewBranch}>
                        <Icon name="git-branch-existing"></Icon>
                        <Text margin={{ left: 'small' }} inline>
                          {getString('common.git.existingBranchCommitLabel')}
                        </Text>
                        <Text
                          margin={{ left: 'small' }}
                          inline
                          padding={{ top: 'xsmall', bottom: 'xsmall', left: 'small', right: 'small' }}
                          background={Color.PRIMARY_2}
                          border={{ radius: 5 }}
                          color={Color.BLACK}
                        >
                          {defaultInitialFormData.branch}
                        </Text>
                      </Radio>
                      {!isNewBranch && CreatePR}
                    </Container>
                    <Container
                      className={css.branchSection}
                      padding={{
                        bottom: isNewBranch ? 'xSmall' : 'small'
                      }}
                    >
                      <Radio
                        data-test="newBranchRadioBtn"
                        large
                        onChange={() => handleBranchTypeChange(true, formik)}
                        checked={isNewBranch}
                      >
                        <Icon name="git-new-branch" color={Color.GREY_700}></Icon>
                        <Text inline margin={{ left: 'small' }}>
                          {getString('common.git.newBranchCommitLabel')}
                        </Text>
                      </Radio>
                      {isNewBranch && (
                        <Container padding={{ top: 'small' }}>
                          <FormInput.Text
                            className={css.branchInput}
                            name="branch"
                            label={getString('common.git.branchName')}
                          />
                          {CreatePR}
                        </Container>
                      )}
                    </Container>
                  </Layout.Vertical>
                </Container>

                <Layout.Horizontal padding={{ top: 'medium' }} spacing="medium">
                  <Button
                    className={css.formButton}
                    type="submit"
                    intent="primary"
                    text={getString('save')}
                    disabled={!currentUserInfo || loadingCodeManagers}
                  />
                  <Button
                    className={css.formButton}
                    text={getString('cancel')}
                    margin={{ left: 'medium' }}
                    onClick={props.onClose}
                  />
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Container>
    </Container>
  )
}

export default SaveToGitForm
