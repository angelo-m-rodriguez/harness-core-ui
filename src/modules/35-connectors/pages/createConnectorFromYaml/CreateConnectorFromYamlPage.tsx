/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Classes, Dialog } from '@blueprintjs/core'
import { isEmpty, noop, omit, pick } from 'lodash-es'
import * as Yup from 'yup'
import {
  Container,
  Button,
  Layout,
  Formik,
  FormikForm,
  Text,
  Icon,
  ButtonVariation,
  PageBody,
  PageHeader,
  shouldShowError,
  useConfirmationDialog,
  useToaster
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color } from '@harness/design-system'
import { parse } from 'yaml'
import { useHistory, useParams } from 'react-router-dom'

import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import { Connector, EntityGitDetails, useCreateConnector, useGetYamlSchema } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { NameIdDescriptionTags, PageSpinner } from '@common/components'
import { useStrings } from 'framework/strings'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import GitContextForm from '@common/components/GitContextForm/GitContextForm'
import { useSaveToGitDialog, UseSaveSuccessResponse } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import type { SaveToGitFormInterface, GitResourceInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import { Entities } from '@common/interfaces/GitSyncInterface'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { connectorGovernanceModalProps } from '@connectors/utils/utils'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { doesGovernanceHasErrorOrWarning } from '@governance/utils'
import { isSMConnector } from '../connectors/utils/ConnectorUtils'
import css from './CreateConnectorFromYamlPage.module.scss'

const CreateConnectorFromYamlPage: React.FC = () => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()
  const { getRBACErrorMessage } = useRBACError()
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const history = useHistory()
  const { showError, showSuccess } = useToaster()
  const { mutate: createConnector, loading: creating } = useCreateConnector({
    queryParams: { accountIdentifier: accountId }
  })
  const opaFlagEnabled = useFeatureFlag(FeatureFlag.OPA_CONNECTOR_GOVERNANCE)

  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal(connectorGovernanceModalProps())
  const [editorContent, setEditorContent] = React.useState<Record<string, any>>()
  const { getString } = useStrings()
  const [hasConnectorChanged, setHasConnectorChanged] = useState<boolean>(false)
  const { isGitSyncEnabled } = useAppStore()
  const [gitResourceDetails, setGitResourceDetails] = useState<GitResourceInterface>({
    gitDetails: {} as EntityGitDetails,
    type: Entities.CONNECTORS,
    name: getString('newConnector'),
    identifier: ''
  })
  const [registeredWithGit, setRegisteredWithGit] = useState<boolean>()
  const [connectorNameBeingCreated, setConnectorNameBeingCreated] = useState<string>()
  const [isSMCtr, setIsSMCtr] = useState<boolean>(false)

  const onConnectorChange = (isEditorDirty: boolean): void => {
    const yamlData = yamlHandler?.getLatestYaml()
    let connectorJSON
    try {
      connectorJSON = parse(yamlData || '') as Connector
    } catch {
      // this catch intentionally left empty
    }
    const isSMConnectorTemp = !!isSMConnector(connectorJSON?.connector?.type)
    if (isGitSyncEnabled && !registeredWithGit && !isSMConnectorTemp) {
      showModal()
    }
    setIsSMCtr(isSMConnectorTemp)
    setHasConnectorChanged(isEditorDirty)
  }

  const rerouteBasedOnContext = (): void => {
    history.push(routes.toConnectors({ accountId, orgIdentifier, projectIdentifier, module }))
  }

  const { openSaveToGitDialog } = useSaveToGitDialog({
    onSuccess: (_gitDetails: SaveToGitFormInterface): Promise<UseSaveSuccessResponse> => handleCreate(_gitDetails),
    onClose: noop
  })

  const handleCreate = async (gitData?: SaveToGitFormInterface): Promise<UseSaveSuccessResponse> => {
    const yamlData = yamlHandler?.getLatestYaml()
    let connectorJSON
    try {
      connectorJSON = parse(yamlData || '') as Connector
    } catch (err) {
      return {
        status: 'ERROR'
      }
    }
    setConnectorNameBeingCreated(connectorJSON?.connector?.name)
    const queryParams = gitData
      ? { accountIdentifier: accountId, ...gitData, baseBranch: gitResourceDetails.gitDetails?.branch }
      : {}
    const response = await createConnector(connectorJSON, { queryParams })
    let { governanceMetaDataHasError, governanceMetaDataHasWarning } = doesGovernanceHasErrorOrWarning(
      response.data?.governanceMetadata
    )
    if (!opaFlagEnabled) {
      governanceMetaDataHasError = false
      governanceMetaDataHasWarning = false
    }
    if (opaFlagEnabled && response.data?.governanceMetadata) {
      conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, () => {
        rerouteBasedOnContext()
      })
    }
    return {
      status: !governanceMetaDataHasError ? response.status : 'FAILURE',
      governanceMetaData: response.data?.governanceMetadata,
      nextCallback: async () => {
        if (!governanceMetaDataHasError && !governanceMetaDataHasWarning) {
          rerouteBasedOnContext()
        }
      }
    }
  }

  const { data: connectorSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'Connectors',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })

  const { openDialog } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: getString('continueWithoutSavingText'),
    titleText: getString('continueWithoutSavingTitle'),
    confirmButtonText: getString('confirm'),
    onCloseDialog: isConfirmed => {
      if (isConfirmed) {
        setEditorContent({})
        setHasConnectorChanged(false)
        setRegisteredWithGit(false)
      }
    }
  })

  const resetEditor = (event: React.MouseEvent<Element, MouseEvent>): void => {
    event.preventDefault()
    event.stopPropagation()
    openDialog()
  }

  React.useEffect(() => {
    if (isGitSyncEnabled) {
      showModal()
    }
  }, [])

  const [showModal, hideModal] = useModalHook(() => {
    const initialValues = { identifier: '', name: '', description: '', tags: {}, repo: '', branch: '' }
    return (
      <Dialog
        style={{ width: 600, paddingBottom: 0, background: 'var(--form-bg)' }}
        isOpen={true}
        enforceFocus={false}
        className={Classes.DIALOG}
      >
        <Container className={css.container}>
          <Button icon="cross" minimal className={css.closeModal} onClick={hideModal} />
          <Text padding="large" font={{ size: 'medium', weight: 'semi-bold' }} color={Color.BLACK}>
            {getString('newConnector')}
          </Text>
          <Container padding="xsmall" className={css.layout}>
            <div>
              <Formik
                initialValues={initialValues}
                formName="connector-create-from-yaml"
                validationSchema={Yup.object().shape({
                  name: NameSchema({ requiredErrorMsg: getString('validation.connectorName') }),
                  identifier: IdentifierSchema(),
                  ...(isGitSyncEnabled
                    ? {
                        repo: Yup.string().trim().required(getString('common.git.validation.repoRequired')),
                        branch: Yup.string().trim().required(getString('common.git.validation.branchRequired'))
                      }
                    : {})
                })}
                onSubmit={values => {
                  setRegisteredWithGit(true)
                  setGitResourceDetails(prevState => ({
                    ...prevState,
                    name: values.name,
                    identifier: values.identifier,
                    gitDetails:
                      values.repo && values.repo.trim().length > 0
                        ? { repoIdentifier: values.repo, branch: values.branch }
                        : undefined
                  }))
                  const connectorPayload = {
                    connector: { ...omit(values, 'repo', 'branch'), projectIdentifier, orgIdentifier }
                  }
                  isEmpty(editorContent)
                    ? setEditorContent(connectorPayload)
                    : setEditorContent(prevState => ({
                        ...prevState,
                        ...connectorPayload
                      }))
                  setHasConnectorChanged(true)
                  hideModal()
                }}
              >
                {formikProps => (
                  <FormikForm>
                    <NameIdDescriptionTags
                      formikProps={formikProps}
                      identifierProps={{
                        isIdentifierEditable: true
                      }}
                    />
                    <GitSyncStoreProvider>
                      <GitContextForm
                        formikProps={formikProps as any}
                        gitDetails={{ ...pick(initialValues, ['repo', 'branch']), getDefaultFromOtherRepo: false }}
                      />
                    </GitSyncStoreProvider>
                    <Container padding={{ top: 'xlarge' }}>
                      <Button
                        intent="primary"
                        type="submit"
                        text={getString('save')}
                        variation={ButtonVariation.PRIMARY}
                      />
                      &nbsp; &nbsp;
                      <Button text={getString('cancel')} onClick={hideModal} variation={ButtonVariation.TERTIARY} />
                    </Container>
                  </FormikForm>
                )}
              </Formik>
            </div>
          </Container>
        </Container>
      </Dialog>
    )
  }, [])

  return (
    <>
      <PageHeader
        title={
          <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
            <Text font={{ size: 'medium', weight: 'semi-bold' }} color={Color.BLACK}>
              {getString('newConnector')}
            </Text>

            {!isSMCtr ? (
              <Layout.Horizontal border={{ left: true, color: Color.GREY_300 }} spacing="medium">
                {gitResourceDetails.gitDetails?.repoIdentifier ? (
                  <Layout.Horizontal spacing="small">
                    <Icon name="repository" margin={{ left: 'large' }}></Icon>
                    <Text>{gitResourceDetails.gitDetails?.repoIdentifier}</Text>
                  </Layout.Horizontal>
                ) : null}
                {gitResourceDetails.gitDetails?.branch ? (
                  <Layout.Horizontal spacing="small">
                    <Icon name="git-new-branch" margin={{ left: 'large' }}></Icon>
                    <Text>{gitResourceDetails.gitDetails?.branch}</Text>
                  </Layout.Horizontal>
                ) : null}
              </Layout.Horizontal>
            ) : null}
          </Layout.Horizontal>
        }
      />
      <PageBody>
        {!isGitSyncEnabled && creating ? (
          <PageSpinner message={getString('connectors.creating', { name: connectorNameBeingCreated })} />
        ) : null}
        <Container padding="xlarge">
          <YAMLBuilder
            fileName={`${gitResourceDetails.name}`.concat('.yaml')}
            entityType="Connectors"
            bind={setYamlHandler}
            showIconMenu={true}
            schema={connectorSchema?.data}
            existingJSON={editorContent}
            height="calc(100vh - 250px)"
            onChange={onConnectorChange}
            showSnippetSection={false}
            isReadOnlyMode={creating}
            yamlSanityConfig={{ removeEmptyString: false }}
          />
          <Layout.Horizontal spacing="small">
            <Button
              text={getString('saveChanges')}
              variation={ButtonVariation.PRIMARY}
              margin={{ top: 'xlarge' }}
              onClick={() => {
                // only sanitized yaml allowed, invalid yaml with/out schema issues should be rejected
                const errorMap = yamlHandler?.getYAMLValidationErrorMap?.()
                if (errorMap && errorMap.size > 0) {
                  showError(getString('yamlBuilder.yamlError'))
                } else {
                  isGitSyncEnabled && !isSMCtr
                    ? openSaveToGitDialog({
                        isEditing: false,
                        resource: gitResourceDetails,
                        payload: parse(yamlHandler?.getLatestYaml?.() || '')
                      })
                    : handleCreate() /* Handling non-git flow */
                        .then(res => {
                          if (res.status === 'SUCCESS') {
                            showSuccess(getString('connectors.createdSuccessfully'))
                            res.nextCallback?.()
                          } else {
                            /* TODO handle error with API status 200 */
                          }
                        })
                        .catch(e => {
                          if (shouldShowError(e)) {
                            showError(getRBACErrorMessage(e))
                          }
                        })
                }
              }}
              disabled={!hasConnectorChanged}
            />
            {hasConnectorChanged ? (
              <Button
                text={getString('cancel')}
                margin={{ top: 'xlarge' }}
                onClick={resetEditor}
                variation={ButtonVariation.TERTIARY}
              />
            ) : null}
          </Layout.Horizontal>
        </Container>
      </PageBody>
    </>
  )
}

export default CreateConnectorFromYamlPage
