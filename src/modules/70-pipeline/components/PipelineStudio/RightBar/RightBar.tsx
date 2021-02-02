import React from 'react'
import * as Yup from 'yup'
import cx from 'classnames'
import {
  Button,
  IconName,
  Formik,
  FormikForm,
  RUNTIME_INPUT_VALUE,
  TextInput,
  FormInput,
  Text
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { isEmpty, set } from 'lodash-es'
import { Classes, Dialog } from '@blueprintjs/core'
import { useAppStore, useStrings } from 'framework/exports'
import {
  ConnectorInfoDTO,
  getConnectorPromise,
  getTestConnectionResultPromise,
  getTestGitRepoConnectionResultPromise,
  PipelineInfoConfig,
  useGetConnector
} from 'services/cd-ng'
import {
  ConnectorReferenceField,
  ConnectorReferenceFieldProps
} from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import {
  getIdentifierFromValue,
  getScopeFromDTO,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { Scope } from '@common/interfaces/SecretsInterface'
import { PipelineContext } from '../PipelineContext/PipelineContext'
import { DrawerTypes, SplitViewTypes } from '../PipelineContext/PipelineActions'
import css from './RightBar.module.scss'

interface CodebaseValues {
  connectorRef?: ConnectorReferenceFieldProps['selected']
  repoName?: string
}

enum CodebaseStatuses {
  NotConfigured = 'notConfigured',
  Valid = 'valid',
  Invalid = 'invalid',
  Validating = 'validating'
}

const codebaseIcons: Record<CodebaseStatuses, IconName> = {
  [CodebaseStatuses.NotConfigured]: 'execution-warning',
  [CodebaseStatuses.Valid]: 'command-artifact-check',
  [CodebaseStatuses.Invalid]: 'circle-cross',
  [CodebaseStatuses.Validating]: 'steps-spinner'
}

export const RightBar = (): JSX.Element => {
  const {
    state: {
      pipeline,
      pipelineView,
      pipelineView: {
        drawerData: { type },
        splitViewData: { type: splitViewType }
      }
    },
    updatePipeline,
    updatePipelineView
  } = React.useContext(PipelineContext)

  const codebase = (pipeline as PipelineInfoConfig)?.properties?.ci?.codebase
  const [codebaseStatus, setCodebaseStatus] = React.useState<CodebaseStatuses>()

  const ciStageExists = pipeline?.stages?.some(stage => {
    if (stage?.stage?.type) {
      return stage?.stage?.type === 'CI'
    } else {
      return false
    }
  })

  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }>
  >()

  const [isCodebaseDialogOpen, setIsCodebaseDialogOpen] = React.useState(false)
  const codebaseInitialValues: CodebaseValues = {
    repoName: codebase?.repoName
  }

  const connectorId = getIdentifierFromValue((codebase?.connectorRef as string) || '')
  const initialScope = getScopeFromValue((codebase?.connectorRef as string) || '')

  const { data: connector, loading, refetch } = useGetConnector({
    identifier: connectorId,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: initialScope === Scope.ORG || initialScope === Scope.PROJECT ? orgIdentifier : undefined,
      projectIdentifier: initialScope === Scope.PROJECT ? projectIdentifier : undefined
    },
    lazy: true,
    debounce: 300
  })

  const [connectionType, setConnectionType] = React.useState('')
  const [connectorUrl, setConnectorUrl] = React.useState('')

  if (connector?.data?.connector) {
    const scope = getScopeFromDTO<ConnectorInfoDTO>(connector?.data?.connector)
    codebaseInitialValues.connectorRef = {
      label: connector?.data?.connector.name || '',
      value: `${scope !== Scope.PROJECT ? `${scope}.` : ''}${connector?.data?.connector.identifier}`,
      scope: scope,
      live: connector?.data?.status?.status === 'SUCCESS',
      connector: connector?.data?.connector
    }
  }

  React.useEffect(() => {
    if (!isEmpty(codebase?.connectorRef)) {
      refetch()
    }
  }, [codebase?.connectorRef])

  React.useEffect(() => {
    if (connector?.data?.connector) {
      setConnectionType(connector?.data?.connector.spec.type)
      setConnectorUrl(connector?.data?.connector.spec.url)
    }
  }, [
    connector?.data?.connector,
    connector?.data?.connector?.spec.type,
    connector?.data?.connector?.spec.url,
    setConnectionType,
    setConnectorUrl
  ])

  React.useEffect(() => {
    if (!codebase?.connectorRef) {
      setCodebaseStatus(CodebaseStatuses.NotConfigured)
    } else {
      const validate = async () => {
        setCodebaseStatus(CodebaseStatuses.Validating)

        const connectorResult = await getConnectorPromise({
          identifier: connectorId,
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier: initialScope === Scope.ORG || initialScope === Scope.PROJECT ? orgIdentifier : undefined,
            projectIdentifier: initialScope === Scope.PROJECT ? projectIdentifier : undefined
          }
        })

        if (connectorResult?.data?.connector?.spec.type === 'Account') {
          try {
            const response = await getTestGitRepoConnectionResultPromise({
              identifier: connectorId,
              queryParams: {
                accountIdentifier: accountId,
                orgIdentifier: initialScope === Scope.ORG || initialScope === Scope.PROJECT ? orgIdentifier : undefined,
                projectIdentifier: initialScope === Scope.PROJECT ? projectIdentifier : undefined,
                repoURL:
                  (connectorResult?.data?.connector?.spec.url[connectorResult?.data?.connector?.spec.url.length - 1] ===
                  '/'
                    ? connectorResult?.data?.connector?.spec.url
                    : connectorResult?.data?.connector?.spec.url + '/') + codebase?.repoName
              },
              body: undefined
            })

            if (response?.data?.status === 'SUCCESS') {
              setCodebaseStatus(CodebaseStatuses.Valid)
            } else {
              setCodebaseStatus(CodebaseStatuses.Invalid)
            }
          } catch (error) {
            setCodebaseStatus(CodebaseStatuses.Invalid)
          }
        } else {
          try {
            const response = await getTestConnectionResultPromise({
              identifier: connectorId,
              queryParams: {
                accountIdentifier: accountId,
                orgIdentifier: initialScope === Scope.ORG || initialScope === Scope.PROJECT ? orgIdentifier : undefined,
                projectIdentifier: initialScope === Scope.PROJECT ? projectIdentifier : undefined
              },
              body: undefined
            })

            if (response?.data?.status === 'SUCCESS') {
              setCodebaseStatus(CodebaseStatuses.Valid)
            } else {
              setCodebaseStatus(CodebaseStatuses.Invalid)
            }
          } catch (error) {
            setCodebaseStatus(CodebaseStatuses.Invalid)
          }
        }
      }

      validate()
    }
  }, [codebase?.connectorRef, codebase?.repoName])
  const { selectedProject } = useAppStore()

  const openCodebaseDialog = React.useCallback(() => {
    setIsCodebaseDialogOpen(true)
  }, [setIsCodebaseDialogOpen])

  const closeCodebaseDialog = React.useCallback(() => {
    setIsCodebaseDialogOpen(false)

    if (!connector?.data?.connector?.spec.type && !connector?.data?.connector?.spec.url) {
      setConnectionType('')
      setConnectorUrl('')
    }
  }, [
    connector?.data?.connector?.spec.type,
    connector?.data?.connector?.spec.url,
    setIsCodebaseDialogOpen,
    setConnectionType,
    setConnectorUrl
  ])

  const { getString } = useStrings()
  return (
    <div className={css.rightBar}>
      <div />
      {typeof codebaseStatus !== 'undefined' &&
        selectedProject?.modules &&
        selectedProject.modules.indexOf?.('CI') > -1 &&
        ciStageExists && (
          <Button
            className={cx(css.iconButton, css.codebaseConfiguration, css[codebaseStatus])}
            text={getString('codebase')}
            font={{ weight: 'semi-bold', size: 'xsmall' }}
            icon={codebaseIcons[codebaseStatus] as IconName}
            iconProps={{ size: 20 }}
            minimal
            onClick={() => {
              updatePipelineView({
                ...pipelineView,
                isDrawerOpened: false,
                drawerData: { type: DrawerTypes.AddStep },
                isSplitViewOpen: false,
                splitViewData: {}
              })
              openCodebaseDialog()
            }}
          />
        )}
      <Button
        className={cx(css.iconButton, css.notificationsIcon, {
          [css.selected]: splitViewType === SplitViewTypes.Notifications
        })}
        onClick={() =>
          updatePipelineView({
            ...pipelineView,
            isSplitViewOpen: true,
            isDrawerOpened: false,
            drawerData: { type: DrawerTypes.AddStep },
            splitViewData: { type: SplitViewTypes.Notifications }
          })
        }
        font={{ weight: 'semi-bold', size: 'xsmall' }}
        icon="yaml-builder-notifications"
        iconProps={{ size: 20 }}
        text={getString('notifications')}
      />

      <Button
        className={cx(css.iconButton, css.variablesIcon, { [css.selected]: type === DrawerTypes.PipelineVariables })}
        onClick={() =>
          updatePipelineView({
            ...pipelineView,
            isDrawerOpened: true,
            drawerData: { type: DrawerTypes.PipelineVariables, size: '100%', hasBackdrop: true },
            isSplitViewOpen: false,
            splitViewData: {}
          })
        }
        font={{ weight: 'semi-bold', size: 'xsmall' }}
        icon="pipeline-variables"
        iconProps={{ size: 20 }}
        text={getString('variableLabel')}
        data-testid="input-variable"
      />
      <div />
      {isCodebaseDialogOpen && (
        <Dialog
          isOpen={true}
          title={
            // TODO: Move to strings
            codebaseStatus === CodebaseStatuses.NotConfigured ? 'Configure Codebase' : 'Edit Codebase Configuration'
          }
          onClose={closeCodebaseDialog}
        >
          <Formik
            enableReinitialize
            initialValues={codebaseInitialValues}
            validationSchema={Yup.object().shape({
              connectorRef: Yup.mixed().required(getString('fieldRequired', { field: getString('connector') })),
              ...(connectionType === 'Account' && {
                repoName: Yup.string().required(getString('pipelineSteps.build.create.repositoryNameRequiredError'))
              })
            })}
            onSubmit={(values): void => {
              set(pipeline, 'properties.ci.codebase', {
                connectorRef:
                  typeof values.connectorRef === 'string' ? values.connectorRef : values.connectorRef?.value,
                ...(values.repoName && { repoName: values.repoName }),
                build: RUNTIME_INPUT_VALUE
              })

              // Repo level connectors should not have repoName
              if (connectionType === 'Repo' && (pipeline as PipelineInfoConfig)?.properties?.ci?.codebase?.repoName) {
                delete (pipeline as PipelineInfoConfig)?.properties?.ci?.codebase?.repoName
              }

              updatePipeline(pipeline)

              closeCodebaseDialog()
            }}
          >
            {({ values, setFieldValue, submitForm, errors }) => (
              <>
                <div className={Classes.DIALOG_BODY}>
                  <FormikForm>
                    <ConnectorReferenceField
                      name="connectorRef"
                      category={'CODE_REPO'}
                      selected={values.connectorRef}
                      width={460}
                      error={errors?.connectorRef}
                      label={getString('connector')}
                      placeholder={loading ? getString('loading') : getString('select')}
                      disabled={loading}
                      accountIdentifier={accountId}
                      projectIdentifier={projectIdentifier}
                      orgIdentifier={orgIdentifier}
                      onChange={(value, scope) => {
                        setConnectionType(value.spec.type)
                        setConnectorUrl(value.spec.url)

                        setFieldValue('connectorRef', {
                          label: value.name || '',
                          value: `${scope !== Scope.PROJECT ? `${scope}.` : ''}${value.identifier}`,
                          scope: scope
                        })
                      }}
                    />
                    {connectionType === 'Repo' ? (
                      <>
                        <Text margin={{ bottom: 'xsmall' }}>
                          {getString('pipelineSteps.build.create.repositoryNameLabel')}
                        </Text>
                        <TextInput name="repoName" value={connectorUrl} style={{ flexGrow: 1 }} disabled />
                      </>
                    ) : (
                      <>
                        <FormInput.Text
                          // TODO: Move to strings, in EditStageView too
                          label={'Repository Name'}
                          name="repoName"
                          style={{ flexGrow: 1 }}
                        />
                        {connectorUrl.length > 0 ? (
                          <div className={css.predefinedValue}>
                            {(connectorUrl[connectorUrl.length - 1] === '/' ? connectorUrl : connectorUrl + '/') +
                              (values.repoName ? values.repoName : '')}
                          </div>
                        ) : null}
                      </>
                    )}
                  </FormikForm>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                  <Button intent="primary" text={getString('save')} onClick={submitForm} /> &nbsp; &nbsp;
                  <Button text={getString('cancel')} onClick={closeCodebaseDialog} />
                </div>
              </>
            )}
          </Formik>
        </Dialog>
      )}
    </div>
  )
}
