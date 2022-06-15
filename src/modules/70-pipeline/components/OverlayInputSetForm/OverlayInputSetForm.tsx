/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { defaultTo, isNull, isUndefined, noop, omit, omitBy } from 'lodash-es'
import type { MutateRequestOptions } from 'restful-react/dist/Mutate'
import { Classes, Dialog, IDialogProps } from '@blueprintjs/core'
import * as Yup from 'yup'
import {
  Button,
  ButtonVariation,
  Formik,
  FormikForm,
  Layout,
  Text,
  PageSpinner,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  Heading,
  Container
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { parse } from 'yaml'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import type { PipelineInfoConfig } from 'services/cd-ng'

import {
  OverlayInputSetResponse,
  useGetPipeline,
  Failure,
  useGetInputSetsListForPipeline,
  useGetOverlayInputSetForPipeline,
  useCreateOverlayInputSetForPipeline,
  useUpdateOverlayInputSetForPipeline,
  ResponseOverlayInputSetResponse,
  useGetSchemaYaml,
  EntityGitDetails,
  UpdateOverlayInputSetForPipelineQueryParams,
  UpdateOverlayInputSetForPipelinePathParams,
  CreateOverlayInputSetForPipelineQueryParams
} from 'services/pipeline-ng'

import { useToaster } from '@common/exports'
import { NameSchema } from '@common/utils/Validation'
import type {
  YamlBuilderHandlerBinding,
  YamlBuilderProps,
  InvocationMapFunction,
  CompletionItemInterface
} from '@common/interfaces/YAMLBuilderProps'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { NameIdDescriptionTags } from '@common/components'
import { useStrings } from 'framework/strings'
import type { InputSetGitQueryParams } from '@common/interfaces/RouteInterfaces'
import { UseSaveSuccessResponse, useSaveToGitDialog } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import GitContextForm, { GitContextProps } from '@common/components/GitContextForm/GitContextForm'
import { useQueryParams } from '@common/hooks'
import { GitSyncForm } from '@gitsync/components/GitSyncForm/GitSyncForm'
import { StoreMetadata, StoreType } from '@common/constants/GitSyncTypes'
import { AppStoreContext, useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import type { CreateUpdateInputSetsReturnType, InputSetDTO } from '@pipeline/utils/types'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { getOverlayErrors } from '@pipeline/utils/runPipelineUtils'
import { ErrorsStrip } from '../ErrorsStrip/ErrorsStrip'
import { InputSetSelector, InputSetSelectorProps } from '../InputSetSelector/InputSetSelector'
import {
  anyOneOf,
  constructInputSetYamlObject,
  getCreateUpdateRequestBodyOptions,
  getInputSetReference
} from './OverlayInputSetUtils'
import css from './OverlayInputSetForm.module.scss'

export interface OverlayInputSetDTO extends Omit<OverlayInputSetResponse, 'identifier'> {
  pipeline?: PipelineInfoConfig
  identifier?: string
  repo?: string
  branch?: string
}

interface SaveOverlayInputSetDTO {
  overlayInputSet: OverlayInputSetDTO
}

const getDefaultInputSet = (
  orgIdentifier: string,
  projectIdentifier: string,
  pipelineIdentifier: string
): OverlayInputSetDTO => ({
  name: undefined,
  identifier: '',
  description: undefined,
  orgIdentifier,
  projectIdentifier,
  pipelineIdentifier,
  inputSetReferences: [],
  tags: {},
  repo: '',
  branch: ''
})

export interface OverlayInputSetFormProps {
  hideForm: () => void
  identifier?: string
  isReadOnly?: boolean
  overlayInputSetRepoIdentifier?: string
  overlayInputSetBranch?: string
}

const dialogProps: Omit<IDialogProps, 'isOpen'> = {
  usePortal: true,
  autoFocus: true,
  canEscapeKeyClose: true,
  canOutsideClickClose: true,
  enforceFocus: false,
  style: { minWidth: 700 }
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `overlay-input-set.yaml`,
  entityType: 'Pipelines',
  width: 620,
  height: 360,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

const clearNullUndefined = /* istanbul ignore next */ (data: OverlayInputSetDTO): OverlayInputSetDTO =>
  omitBy(omitBy(data, isUndefined), isNull)

export function OverlayInputSetForm({
  hideForm,
  identifier,
  isReadOnly = false,
  overlayInputSetRepoIdentifier,
  overlayInputSetBranch
}: OverlayInputSetFormProps): React.ReactElement {
  const { getString } = useStrings()
  const [isOpen, setIsOpen] = React.useState(true)
  const [isEdit, setIsEdit] = React.useState(false)
  const [savedInputSetObj, setSavedInputSetObj] = React.useState<OverlayInputSetDTO>({})
  const { isGitSyncEnabled } = React.useContext(AppStoreContext)
  const { isGitSimplificationEnabled: gitSimplification } = useAppStore()
  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
    pipelineIdentifier: string
  }>()
  const { repoIdentifier, branch, connectorRef, storeType, repoName } = useQueryParams<InputSetGitQueryParams>()

  const [initialGitDetails, setInitialGitDetails] = React.useState<EntityGitDetails>({ repoIdentifier, branch })
  const [initialStoreMetadata, setInitialStoreMetadata] = React.useState<StoreMetadata>({
    repoName,
    branch,
    connectorRef,
    storeType
  })
  const [selectedView, setSelectedView] = React.useState<SelectedView>(SelectedView.VISUAL)
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedRepo, setSelectedRepo] = React.useState<string>(overlayInputSetRepoIdentifier || repoIdentifier || '')
  const [selectedBranch, setSelectedBranch] = React.useState<string>(overlayInputSetBranch || branch || '')
  const [selectedInputSets, setSelectedInputSets] = React.useState<InputSetSelectorProps['value']>()
  const { showSuccess, showError, clear } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const [formErrors, setFormErrors] = React.useState<Record<string, any>>({})
  const commonQueryParams = useMemo(() => {
    return {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    }
  }, [accountId, orgIdentifier, pipelineIdentifier, projectIdentifier, repoIdentifier, branch])

  const {
    data: overlayInputSetResponse,
    refetch: refetchOverlay,
    loading: loadingOverlayInputSet,
    error: errorOverlayInputSet
  } = useGetOverlayInputSetForPipeline({
    queryParams: {
      ...commonQueryParams,
      repoIdentifier: isGitSyncEnabled ? overlayInputSetRepoIdentifier : repoName,
      branch: isGitSyncEnabled ? overlayInputSetBranch : branch
    },
    inputSetIdentifier: defaultTo(identifier, ''),
    lazy: true
  })

  const { mutate: createOverlayInputSet, loading: createOverlayInputSetLoading } = useCreateOverlayInputSetForPipeline({
    queryParams: commonQueryParams,
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })
  const { mutate: updateOverlayInputSet, loading: updateOverlayInputSetLoading } = useUpdateOverlayInputSetForPipeline({
    queryParams: commonQueryParams,
    inputSetIdentifier: '',
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const {
    data: inputSetList,
    refetch: refetchInputSetList,
    loading: loadingInputSetList,
    error: errorInputSetList
  } = useGetInputSetsListForPipeline({
    queryParams: {
      ...commonQueryParams,
      inputSetType: 'INPUT_SET',
      repoIdentifier: selectedRepo,
      branch: selectedBranch,
      getDefaultFromOtherRepo: true
    },
    debounce: 300,
    lazy: true
  })

  const {
    data: pipeline,
    loading: loadingPipeline,
    refetch: refetchPipeline,
    error: errorPipeline
  } = useGetPipeline({
    pipelineIdentifier,
    lazy: true,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    }
  })

  const inputSet = React.useMemo(() => {
    if (!overlayInputSetResponse?.data) {
      return getDefaultInputSet(orgIdentifier, projectIdentifier, pipelineIdentifier)
    }
    const inputSetObj = overlayInputSetResponse.data
    const parsedInputSetObj = parse(defaultTo(inputSetObj?.overlayInputSetYaml, ''))
    if ((isGitSyncEnabled || inputSetObj.storeType === StoreType.REMOTE) && parsedInputSetObj?.overlayInputSet) {
      const parsedOverlayInputSet = parsedInputSetObj.overlayInputSet as OverlayInputSetDTO
      return {
        name: parsedOverlayInputSet.name as string,
        tags: parsedOverlayInputSet.tags as {
          [key: string]: string
        },
        identifier: parsedOverlayInputSet.identifier as string,
        description: parsedOverlayInputSet.description as string,
        orgIdentifier: parsedOverlayInputSet.orgIdentifier as string,
        projectIdentifier: parsedOverlayInputSet.projectIdentifier as string,
        pipelineIdentifier: parsedOverlayInputSet.pipelineIdentifier as string,
        inputSetReferences: defaultTo(parsedOverlayInputSet.inputSetReferences, []),
        gitDetails: defaultTo(inputSetObj.gitDetails, {}),
        entityValidityDetails: defaultTo(inputSetObj.entityValidityDetails, {})
      }
    }
    return {
      name: inputSetObj.name,
      tags: inputSetObj.tags,
      identifier: inputSetObj.identifier,
      description: inputSetObj.description,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      inputSetReferences: defaultTo(inputSetObj?.inputSetReferences, []),
      gitDetails: defaultTo(inputSetObj.gitDetails, {}),
      entityValidityDetails: defaultTo(inputSetObj.entityValidityDetails, {})
    }
  }, [overlayInputSetResponse?.data, isGitSyncEnabled])

  const [disableVisualView, setDisableVisualView] = React.useState(inputSet.entityValidityDetails?.valid === false)

  React.useEffect(() => {
    if (inputSet.entityValidityDetails?.valid === false || selectedView === SelectedView.YAML) {
      setSelectedView(SelectedView.YAML)
    } else {
      setSelectedView(SelectedView.VISUAL)
    }
  }, [inputSet, inputSet.entityValidityDetails?.valid])

  React.useEffect(() => {
    if (inputSet.entityValidityDetails?.valid === false) {
      setDisableVisualView(true)
    } else {
      setDisableVisualView(false)
    }
  }, [inputSet.entityValidityDetails?.valid])

  const inputSetListYaml: CompletionItemInterface[] = React.useMemo(() => {
    if (!inputSetList?.data?.content) return []
    return inputSetList.data.content.map(constructInputSetYamlObject)
  }, [inputSetList?.data?.content])

  React.useEffect(() => {
    const inputSetsToSelect = inputSet.inputSetReferences?.map(inputSetRef => {
      const foundInputSet = inputSetList?.data?.content?.find(currInputSet => currInputSet.identifier === inputSetRef)
      return {
        ...foundInputSet,
        label: defaultTo(foundInputSet?.name, ''),
        value: defaultTo(foundInputSet?.identifier, ''),
        type: foundInputSet?.inputSetType,
        gitDetails: defaultTo(foundInputSet?.gitDetails, {}),
        inputSetErrorDetails: foundInputSet?.inputSetErrorDetails,
        overlaySetErrorDetails: foundInputSet?.overlaySetErrorDetails
      }
    })
    setSelectedInputSets(inputSetsToSelect)
  }, [inputSetList?.data?.content, inputSet.inputSetReferences])

  React.useEffect(() => {
    if (identifier) {
      setIsEdit(true)
      refetchPipeline()
      refetchInputSetList()
      refetchOverlay({ pathParams: { inputSetIdentifier: identifier } })
    } else {
      refetchPipeline()
      refetchInputSetList()
      setIsEdit(false)
    }
  }, [identifier])

  React.useEffect(() => {
    refetchInputSetList()
  }, [selectedRepo, selectedBranch])

  const onRepoChange = (gitDetails: EntityGitDetails) => {
    setSelectedRepo(defaultTo(gitDetails.repoIdentifier, ''))
    setSelectedBranch(defaultTo(gitDetails.branch, ''))
  }

  const onBranchChange = (gitDetails: EntityGitDetails) => {
    setSelectedBranch(defaultTo(gitDetails.branch, ''))
  }

  const handleModeSwitch = React.useCallback(
    (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '')
        const inputSetYamlVisual = parse(yaml).overlayInputSet as OverlayInputSetDTO

        inputSet.name = inputSetYamlVisual.name
        inputSet.identifier = inputSetYamlVisual.identifier
        inputSet.description = inputSetYamlVisual.description
        inputSet.pipeline = inputSetYamlVisual.pipeline
        inputSet.inputSetReferences = inputSetYamlVisual.inputSetReferences
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml, inputSet]
  )

  const closeForm = React.useCallback(() => {
    setIsOpen(false)
    hideForm()
  }, [hideForm])

  const createUpdateOverlayInputSet = async (
    inputSetObj: InputSetDTO,
    gitDetails?: SaveToGitFormInterface,
    objectId = ''
  ): CreateUpdateInputSetsReturnType => {
    let response: ResponseOverlayInputSetResponse | null = null
    try {
      const requestData = yamlStringify({ overlayInputSet: clearNullUndefined(inputSetObj) }) as any
      const requestOptions = getCreateUpdateRequestBodyOptions({
        isEdit,
        initialGitDetails,
        inputSetObj,
        orgIdentifier,
        accountId,
        projectIdentifier,
        pipelineIdentifier,
        gitDetails,
        objectId,
        initialStoreMetadata
      })
      response = isEdit
        ? await updateOverlayInputSet(requestData, {
            ...(requestOptions as MutateRequestOptions<
              UpdateOverlayInputSetForPipelineQueryParams,
              UpdateOverlayInputSetForPipelinePathParams
            >)
          })
        : await createOverlayInputSet(requestData, {
            ...(requestOptions as MutateRequestOptions<CreateOverlayInputSetForPipelineQueryParams, void>)
          })

      if (response) {
        // This is done because when git sync is enabled, errors are displayed in a modal
        if (!isGitSyncEnabled && initialStoreMetadata.storeType !== StoreType.REMOTE) {
          if (response.data?.errorResponse) {
            clear()
            showError(getString('inputSets.overlayInputSetSavedError'), undefined, 'pipeline.overlayinputset.error')
          } else {
            clear()
            showSuccess(getString('inputSets.overlayInputSetSaved'))
          }
        }
      }
      if (!isGitSyncEnabled && initialStoreMetadata.storeType !== StoreType.REMOTE) {
        closeForm()
      }
    } catch (e) {
      const invaliderrors = getOverlayErrors(e?.data?.metadata?.invalidReferences)
      if (Object.keys(invaliderrors).length) {
        setFormErrors(invaliderrors)
      }
      // This is done because when git sync is enabled or storeType is REMOTE, errors are displayed in a modal
      if (!isGitSyncEnabled && initialStoreMetadata.storeType !== StoreType.REMOTE) {
        showError(getRBACErrorMessage(e), undefined, 'pipeline.common.error')
      } else {
        throw e
      }
    }
    return {
      status: response?.status,
      nextCallback: () => closeForm()
    }
  }

  const { openSaveToGitDialog } = useSaveToGitDialog<SaveOverlayInputSetDTO>({
    onSuccess: (
      gitData: SaveToGitFormInterface,
      payload?: SaveOverlayInputSetDTO,
      objectId?: string
    ): Promise<UseSaveSuccessResponse> =>
      createUpdateOverlayInputSet(defaultTo(payload?.overlayInputSet, savedInputSetObj), gitData, objectId)
  })

  const handleSubmit = React.useCallback(
    async (
      inputSetObjWithGitInfo: OverlayInputSetDTO,
      gitDetails?: EntityGitDetails,
      storeMetadata?: StoreMetadata
    ) => {
      const inputSetObj = omit(
        inputSetObjWithGitInfo,
        'repo',
        'branch',
        'connectorRef',
        'repoName',
        'filePath',
        'storeType'
      )
      setSavedInputSetObj(inputSetObj)
      setInitialGitDetails(defaultTo(isEdit ? overlayInputSetResponse?.data?.gitDetails : gitDetails, {}))
      setInitialStoreMetadata(defaultTo(storeMetadata, {}))
      if (inputSetObj) {
        delete inputSetObj.pipeline
        if (isGitSyncEnabled || storeMetadata?.storeType === StoreType.REMOTE) {
          openSaveToGitDialog({
            isEditing: isEdit,
            resource: {
              type: 'InputSets',
              name: inputSetObj.name as string,
              identifier: inputSetObj.identifier as string,
              gitDetails: isEdit ? overlayInputSetResponse?.data?.gitDetails : gitDetails,
              storeMetadata: storeMetadata?.storeType === StoreType.REMOTE ? storeMetadata : undefined
            },
            payload: { overlayInputSet: inputSetObj }
          })
        } else {
          createUpdateOverlayInputSet(inputSetObj)
        }
      }
    },
    [
      isEdit,
      showSuccess,
      closeForm,
      showError,
      createOverlayInputSet,
      updateOverlayInputSet,
      isGitSyncEnabled,
      overlayInputSetResponse,
      pipeline
    ]
  )

  const hasAnyApiError = useMemo(() => {
    return anyOneOf([errorPipeline, errorOverlayInputSet, errorInputSetList])
  }, [errorPipeline, errorOverlayInputSet, errorInputSetList])

  if (hasAnyApiError) {
    clear()
    showError(
      defaultTo((hasAnyApiError.data as Failure)?.message, getString('commonError')),
      undefined,
      'pipeline.common.error'
    )
  }

  const invocationMap: YamlBuilderProps['invocationMap'] = new Map<RegExp, InvocationMapFunction>()
  invocationMap.set(
    /^.+\.inputSetReferences$/,
    (_matchingPath: string, _currentYaml: string): Promise<CompletionItemInterface[]> => {
      return new Promise(resolve => {
        resolve(inputSetListYaml)
      })
    }
  )

  const { loading, data: pipelineSchema } = useGetSchemaYaml({
    queryParams: {
      entityType: 'Pipelines',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })

  const selectedInputSetReferences: string[] | undefined = React.useMemo(() => {
    return selectedInputSets?.map(getInputSetReference)
  }, [selectedInputSets])

  const anyApiLoading = useMemo(() => {
    return anyOneOf([
      loadingPipeline,
      createOverlayInputSetLoading,
      updateOverlayInputSetLoading,
      loadingInputSetList,
      loadingOverlayInputSet
    ])
  }, [
    loadingPipeline,
    createOverlayInputSetLoading,
    updateOverlayInputSetLoading,
    loadingInputSetList,
    loadingOverlayInputSet
  ])

  return (
    <Dialog
      title={
        isEdit
          ? getString('inputSets.editOverlayTitle', { name: inputSet.name })
          : getString('inputSets.newOverlayInputSet')
      }
      onClose={() => closeForm()}
      isOpen={isOpen}
      {...dialogProps}
    >
      {anyApiLoading && <PageSpinner />}
      <div className={Classes.DIALOG_BODY}>
        <Layout.Vertical spacing="medium">
          <div className={css.optionBtns}>
            <VisualYamlToggle
              selectedView={selectedView}
              onChange={nextMode => {
                handleModeSwitch(nextMode)
              }}
              disableToggle={disableVisualView}
            />
          </div>

          <Formik<OverlayInputSetDTO & GitContextProps & StoreMetadata>
            initialValues={{
              ...omit(inputSet, 'gitDetails', 'entityValidityDetails'),
              repo: defaultTo(repoIdentifier, ''),
              branch: defaultTo(branch, ''),
              connectorRef: defaultTo(connectorRef, ''),
              repoName: defaultTo(repoName, ''),
              storeType: defaultTo(storeType, StoreType.INLINE),
              filePath: defaultTo(inputSet.gitDetails?.filePath, `.harness/${inputSet.identifier}.yaml`)
            }}
            formName="overlayInputSet"
            enableReinitialize={true}
            validationSchema={Yup.object().shape({
              name: NameSchema({ requiredErrorMsg: getString('common.validation.nameIsRequired') }),
              inputSetReferences: Yup.array().of(Yup.string().required(getString('inputSets.inputSetIsRequired')))
            })}
            onSubmit={values => {
              handleSubmit(
                { ...values, inputSetReferences: selectedInputSetReferences },
                { repoIdentifier: values.repo, branch: values.branch, repoName: values.repo },
                {
                  connectorRef: values.connectorRef,
                  repoName: values.repo,
                  branch: values.branch,
                  filePath: values.filePath,
                  storeType: values.storeType
                }
              )
            }}
          >
            {formikProps => {
              return (
                <>
                  {selectedView === SelectedView.VISUAL ? (
                    <>
                      <ErrorsStrip formErrors={formErrors} />
                      <FormikForm>
                        <div className={css.inputSetForm}>
                          <NameIdDescriptionTags
                            className={css.inputSetName}
                            identifierProps={{
                              inputLabel: getString('name'),
                              isIdentifierEditable: !isEdit && !isReadOnly,
                              inputGroupProps: {
                                disabled: isReadOnly
                              }
                            }}
                            descriptionProps={{ disabled: isReadOnly }}
                            tagsProps={{
                              disabled: isReadOnly
                            }}
                            formikProps={formikProps}
                          />
                          {isGitSyncEnabled && (
                            <GitSyncStoreProvider>
                              <GitContextForm
                                formikProps={formikProps}
                                gitDetails={
                                  isEdit
                                    ? { ...overlayInputSetResponse?.data?.gitDetails, getDefaultFromOtherRepo: false }
                                    : {
                                        repoIdentifier,
                                        branch,
                                        getDefaultFromOtherRepo: true
                                      }
                                }
                                onRepoChange={onRepoChange}
                                onBranchChange={onBranchChange}
                              />
                            </GitSyncStoreProvider>
                          )}
                          {!isGitSyncEnabled && gitSimplification && storeType === StoreType.REMOTE && (
                            <Container>
                              <GitSyncForm
                                formikProps={formikProps as any}
                                handleSubmit={noop}
                                isEdit={isEdit}
                                disableFields={
                                  !isEdit
                                    ? {
                                        connectorRef: true,
                                        repoName: true,
                                        branch: true,
                                        filePath: false
                                      }
                                    : {}
                                }
                              ></GitSyncForm>
                            </Container>
                          )}
                          <Layout.Vertical padding={{ top: 'large', bottom: 'xxxlarge' }} spacing="small">
                            <Heading level={5}>{getString('inputSets.selectInputSets')}</Heading>
                            <Text
                              icon="info-sign"
                              iconProps={{ intent: 'primary', size: 16, padding: { left: 0, right: 'small' } }}
                            >
                              {getString('inputSets.selectInputSetsHelp')}
                            </Text>
                            {inputSet && (
                              <GitSyncStoreProvider>
                                <InputSetSelector
                                  pipelineIdentifier={pipelineIdentifier}
                                  onChange={inputsets => {
                                    setSelectedInputSets(inputsets)
                                  }}
                                  value={selectedInputSets}
                                  selectedRepo={selectedRepo}
                                  selectedBranch={selectedBranch}
                                  isOverlayInputSet={true}
                                  selectedValueClass={css.selectedInputSetsContainer}
                                />
                              </GitSyncStoreProvider>
                            )}
                          </Layout.Vertical>
                        </div>
                        <Layout.Horizontal padding={{ top: 'medium' }}>
                          <Button
                            variation={ButtonVariation.PRIMARY}
                            type="submit"
                            text={getString('save')}
                            disabled={isReadOnly}
                          />
                          &nbsp; &nbsp;
                          <Button variation={ButtonVariation.TERTIARY} onClick={closeForm} text={getString('cancel')} />
                        </Layout.Horizontal>
                      </FormikForm>
                    </>
                  ) : (
                    <div className={css.editor}>
                      <ErrorsStrip formErrors={formErrors} />
                      {loading ? (
                        <PageSpinner />
                      ) : (
                        <YAMLBuilder
                          {...yamlBuilderReadOnlyModeProps}
                          existingJSON={{
                            overlayInputSet: {
                              ...omit(
                                formikProps?.values,
                                'pipeline',
                                'repo',
                                'branch',
                                'connectorRef',
                                'repoName',
                                'filePath',
                                'storeType'
                              ),
                              inputSetReferences: selectedInputSetReferences
                            }
                          }}
                          invocationMap={invocationMap}
                          bind={setYamlHandler}
                          schema={pipelineSchema?.data}
                          isReadOnlyMode={isReadOnly}
                          showSnippetSection={false}
                          isEditModeSupported={!isReadOnly}
                        />
                      )}
                      <Layout.Horizontal padding={{ top: 'medium' }}>
                        <Button
                          variation={ButtonVariation.PRIMARY}
                          type="submit"
                          text={getString('save')}
                          onClick={() => {
                            const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), '')

                            handleSubmit(
                              parse(latestYaml)?.overlayInputSet,
                              {
                                repoIdentifier: formikProps.values.repo,
                                branch: formikProps.values.branch,
                                repoName: formikProps.values.repo
                              },
                              {
                                connectorRef: formikProps.values.connectorRef,
                                repoName: formikProps.values.repo,
                                branch: formikProps.values.branch,
                                filePath: formikProps.values.filePath,
                                storeType: formikProps.values.storeType
                              }
                            )
                          }}
                          disabled={isReadOnly}
                        />
                        &nbsp; &nbsp;
                        <Button variation={ButtonVariation.TERTIARY} onClick={closeForm} text={getString('cancel')} />
                      </Layout.Horizontal>
                    </div>
                  )}
                </>
              )
            }}
          </Formik>
        </Layout.Vertical>
      </div>
    </Dialog>
  )
}
