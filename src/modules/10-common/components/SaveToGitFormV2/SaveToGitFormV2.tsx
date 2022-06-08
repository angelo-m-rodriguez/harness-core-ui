/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useState } from 'react'
import * as Yup from 'yup'
import { pick, defaultTo } from 'lodash-es'
import type { FormikContextType } from 'formik'
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
  Icon
} from '@harness/uicore'
import { Color } from '@harness/design-system'
import type { GitSyncEntityDTO, EntityGitDetails } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { getEntityNameFromType } from '@common/utils/StringUtils'
import type { StoreMetadata } from '@common/constants/GitSyncTypes'
import RepoBranchSelectV2 from '../RepoBranchSelectV2/RepoBranchSelectV2'
import css from './SaveToGitFormV2.module.scss'

export interface GitResourceInterface {
  type: GitSyncEntityDTO['entityType']
  name: string
  identifier: string
  gitDetails?: EntityGitDetails
  storeMetadata?: StoreMetadata
}

interface SaveToGitFormV2Props {
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  isEditing: boolean
  resource: GitResourceInterface
}

interface ModalConfigureProps {
  onClose?: () => void
  onSuccess?: (data: SaveToGitFormV2Interface) => void
}

export interface SaveToGitFormV2Interface {
  isNewBranch: boolean
  branch: string
  targetBranch?: string
  filePath?: string
  commitMsg: string
  createPr: boolean
}

const SaveToGitFormV2: React.FC<ModalConfigureProps & SaveToGitFormV2Props> = props => {
  const { isEditing = false, resource } = props
  const { getString } = useStrings()
  const [isNewBranch, setIsNewBranch] = React.useState(false)
  const formikRef = useRef<FormikContextType<SaveToGitFormV2Interface>>()
  const [targetBranch, setTargetBranch] = useState<string>('')
  const [createPR, setCreatePR] = useState<boolean>(false)
  const [disableBranchSelection, setDisableBranchSelection] = useState<boolean>(true)

  const defaultInitialFormData: SaveToGitFormV2Interface = {
    isNewBranch: false,
    branch: defaultTo(resource.gitDetails?.branch, ''),
    commitMsg: getString(isEditing ? 'common.gitSync.updateResource' : 'common.gitSync.createResource', {
      name: resource.name,
      type: getEntityNameFromType(resource.type)
    }),

    createPr: false,
    targetBranch: ''
  }

  const handleBranchTypeChange = (isNew: boolean, formik: FormikContextType<SaveToGitFormV2Interface>): void => {
    if (isNewBranch !== isNew) {
      setIsNewBranch(isNew)
      formik.setFieldValue('branch', `${resource.gitDetails?.branch}-patch`)
      formik.setFieldTouched('branch', false)
    }
    formik.setFieldValue('targetBranch', isNew ? resource.gitDetails?.branch || '' : '')
    formik.setFieldTouched('targetBranch', false)
    formik.setFieldValue('createPr', false)
    formik.setFieldTouched('createPr', false)
    setDisableBranchSelection(true)
  }

  const CreatePR = React.useMemo(() => {
    return (
      <Layout.Horizontal flex={{ alignItems: 'baseline', justifyContent: 'flex-start' }} padding={{ top: 'small' }}>
        <FormInput.CheckBox
          margin={{ right: 'small' }}
          name="createPr"
          label={getString('common.git.startPRLabel')}
          onChange={e => {
            formikRef.current?.setFieldValue('createPr', e.currentTarget.checked)
            setCreatePR(e.currentTarget.checked)
            if (e.currentTarget.checked) {
              setDisableBranchSelection(false)
            } else {
              setDisableBranchSelection(true)
            }
          }}
        />

        <RepoBranchSelectV2
          name="targetBranch"
          noLabel={true}
          disabled={disableBranchSelection}
          connectorIdentifierRef={resource.storeMetadata?.connectorRef}
          repoName={resource.gitDetails?.repoName}
          onChange={(selected: SelectOption, options?: SelectOption[]) => {
            if (!options?.find(branch => branch.value === selected.value)) {
              formikRef.current?.setFieldValue('targetBranch', '')
            } else {
              formikRef.current?.setFieldValue('targetBranch', selected.value)
              setTargetBranch(selected.value as string)
            }
          }}
          selectedValue={targetBranch}
          showErrorInModal
        />
      </Layout.Horizontal>
    )
  }, [
    disableBranchSelection,
    isNewBranch,
    formikRef.current?.values,
    formikRef.current?.values?.targetBranch,
    createPR
  ])

  return (
    <Container height={'inherit'} className={css.modalContainer}>
      <Text
        className={css.modalHeader}
        font={{ weight: 'semi-bold' }}
        color={Color.GREY_800}
        padding={{ bottom: 'small' }}
        margin={{ bottom: 'small', top: 'xlarge' }}
      >
        {getString('common.git.saveResourceLabel', { resource: props.resource.type })}
      </Text>

      <Container className={css.modalBody}>
        <Formik<SaveToGitFormV2Interface>
          initialValues={defaultInitialFormData}
          formName="saveToGitFormV2"
          validationSchema={Yup.object().shape({
            branch: Yup.string().trim().required(getString('validation.branchName')),
            targetBranch: Yup.string()
              .trim()
              .when('createPr', {
                is: true,
                then: Yup.string().required(getString('common.git.validation.targetBranch'))
              })
              .when('createPr', {
                is: true,
                then: Yup.string().notOneOf([Yup.ref('branch')], getString('common.git.validation.sameBranches'))
              }),
            commitMsg: Yup.string().trim().min(1).required(getString('common.git.validation.commitMessage'))
          })}
          onSubmit={formData => {
            props.onSuccess?.({
              ...pick(formData, ['commitMsg', 'createPr']),
              isNewBranch,
              branch: isNewBranch ? formData.branch : defaultInitialFormData.branch,
              ...(isNewBranch ? { baseBranch: defaultInitialFormData.branch } : {}),
              ...(formData.createPr ? { targetBranch: formData.targetBranch } : {})
            })
          }}
        >
          {formik => {
            formikRef.current = formik
            return (
              <FormikForm>
                <Container className={css.formBody}>
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
                  <Button className={css.formButton} type="submit" intent="primary" text={getString('save')} />
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

export default SaveToGitFormV2
