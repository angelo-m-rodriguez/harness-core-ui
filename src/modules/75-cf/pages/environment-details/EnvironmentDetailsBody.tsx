/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useMemo } from 'react'
import { Container, Layout, Text, Utils, PageError, TableV2 } from '@harness/uicore'
import type { Column } from 'react-table'
import { FontVariation, Color, Intent } from '@harness/design-system'
import type { EnvironmentResponseDTO } from 'services/cd-ng'
import { ApiKey, ApiKeys, useDeleteAPIKey, UseGetAllAPIKeysProps } from 'services/cf'
import { useToaster } from '@common/exports'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { useEnvStrings } from '@cf/hooks/environment'
import { getErrorMessage, showToaster } from '@cf/utils/CFUtils'
import { withTableData } from '@cf/utils/table-utils'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useConfirmAction } from '@common/hooks'
import { NoData } from '@cf/components/NoData/NoData'
import { String } from 'framework/strings'
import AddKeyDialog from '../../components/AddKeyDialog/AddKeyDialog'
import EmptySDKs from './NoSDKs.svg'

import css from './EnvironmentDetails.module.scss'
export interface EnvironmentDetailsBodyProps {
  environment: EnvironmentResponseDTO
  onNewKeyCreated: () => void
  refetch: (queryParams?: UseGetAllAPIKeysProps) => void
  error: unknown
  loading: boolean
  data: ApiKeys | null
  updatePageNumber: (pageNumber: number) => void
  updateApiKeyList: (key: ApiKey) => void
  recents: ApiKey[]
}

type CustomColumn<T extends Record<string, any>> = Column<T>

type RowFunctions = {
  environmentIdentifier: string
  isNew: (id: string) => boolean
  onDelete: (id: string, name: string) => void
  getSecret: (id: string, fallback: string) => string
}
const defaultContext = { environmentIdentifier: '', isNew: () => false, onDelete: () => false, getSecret: () => '' }
const RowContext = React.createContext<RowFunctions>(defaultContext)

const withApiKey = withTableData<ApiKey, { apiKey: ApiKey }>(({ row }) => ({ apiKey: row.original }))

const NameCell = withApiKey(({ apiKey }) => (
  <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREY_800}>
    {apiKey.name}
  </Text>
))

const TypeCell = withApiKey(({ apiKey }) => {
  const { getEnvString } = useEnvStrings()

  return (
    <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_800}>
      {getEnvString(`apiKeys.${apiKey.type.toLowerCase()}Type`)}
    </Text>
  )
})

const ApiInfoCell = withApiKey(({ apiKey }) => {
  const { isNew, getSecret } = useContext(RowContext) ?? defaultContext
  const { getString, getEnvString } = useEnvStrings()
  const { showSuccess, showError } = useToaster()
  const showCopy = isNew(apiKey.identifier)

  const apiKeyText = showCopy ? getSecret(apiKey.identifier, apiKey.apiKey) : apiKey.apiKey

  const handleCopy = (): void => {
    Utils.copy(apiKeyText)
      .then(() => showSuccess(getString('clipboardCopySuccess')))
      .catch(() => showError(getString('clipboardCopyFail'), undefined, 'cf.copy.text.error'))
  }

  return (
    <>
      <Layout.Horizontal spacing="medium" flex={{ alignItems: 'center' }} className={css.keyContainer}>
        <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREY_800} className={css.keyType}>
          {getString('secretType')}:
        </Text>
        {showCopy ? (
          <div className={css.keyCopyContainer}>
            <Text
              font={{ mono: true, variation: FontVariation.BODY2 }}
              color={Color.GREY_800}
              rightIcon="main-clone"
              rightIconProps={{
                onClick: handleCopy,
                color: Color.GREY_350,
                className: css.keyCopyIcon
              }}
              padding={{ left: 'small', right: 'small', top: 'xsmall', bottom: 'xsmall' }}
              className={css.keyCopy}
            >
              {apiKeyText}
            </Text>
          </div>
        ) : (
          <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREY_800}>
            {apiKeyText}
          </Text>
        )}
      </Layout.Horizontal>
      {showCopy && (
        <Text
          padding={{ top: 'xsmall' }}
          font={{ variation: FontVariation.TINY }}
          color={Color.ORANGE_900}
          icon="warning-icon"
        >
          {getEnvString('apiKeys.redactionWarning')}
        </Text>
      )}
    </>
  )
})

const DeleteCell = withApiKey(({ apiKey }) => {
  const { environmentIdentifier, onDelete } = useContext(RowContext) ?? defaultContext
  const { getString, getEnvString } = useEnvStrings()

  const deleteSDKKey = useConfirmAction({
    intent: Intent.DANGER,
    title: getEnvString('apiKeys.deleteTitle'),
    message: <String useRichText stringID="cf.environments.apiKeys.deleteMessage" vars={{ keyName: apiKey.name }} />,
    action: () => {
      onDelete(apiKey.identifier, apiKey.name)
    },
    confirmText: getString('delete')
  })

  return (
    <div className={css.deleteBtnContainer}>
      <RbacButton
        minimal
        icon="trash"
        iconProps={{
          size: 16
        }}
        className={css.keyDeleteButton}
        onClick={deleteSDKKey}
        permission={{
          resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: environmentIdentifier },
          permission: PermissionIdentifier.EDIT_ENVIRONMENT
        }}
      />
    </div>
  )
})

const EnvironmentSDKKeys: React.FC<EnvironmentDetailsBodyProps> = ({
  environment,
  onNewKeyCreated,
  refetch,
  data,
  loading,
  error,
  updatePageNumber,
  updateApiKeyList,
  recents
}) => {
  const { showError } = useToaster()
  const { getString, getEnvString } = useEnvStrings()

  const queryParams = {
    projectIdentifier: environment.projectIdentifier as string,
    environmentIdentifier: environment.identifier as string,
    accountIdentifier: environment.accountId as string,
    orgIdentifier: environment.orgIdentifier as string
  }

  const { mutate: deleteKey } = useDeleteAPIKey({ queryParams })
  const handleDelete = (id: string, keyName: string): void => {
    deleteKey(id)
      .then(() => showToaster(getString('cf.environments.apiKeys.deleteSuccess', { keyName })))
      .then(() => refetch())
      .catch(deleteError => showError(getErrorMessage(deleteError), undefined, 'cf.delete.api.key.error'))
  }

  const { apiKeys } = data ?? {
    apiKeys: []
  }

  const hasData = !error && !loading && (apiKeys || []).length > 0
  const emptyData = !error && !loading && (apiKeys || []).length === 0

  const columns: CustomColumn<ApiKey>[] = useMemo(
    () => [
      {
        Header: getString('name').toUpperCase(),
        accessor: 'name',
        width: '25%',
        Cell: NameCell
      },
      {
        Header: getString('typeLabel').toUpperCase(),
        accessor: 'type',
        width: '10%',
        Cell: TypeCell
      },
      {
        id: 'info',
        width: '40%',
        Cell: ApiInfoCell
      },
      {
        // will display once BE is in
        // Header: getString('cf.environments.apiKeys.lastUsed').toUpperCase(),
        id: 'lastUsed',
        width: '20%'
      },
      {
        id: 'delete',
        width: '5%',
        Cell: DeleteCell
      }
    ],
    []
  )

  return (
    <Container width="100%" height="calc(100vh - 174px)">
      {hasData && (
        <Layout.Vertical
          padding={{ top: 'xlarge', left: 'xlarge', right: 'xlarge' }}
          flex={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}
        >
          <Layout.Horizontal width="100%" flex={{ distribution: 'space-between', alignItems: 'baseline' }}>
            <Text font={{ variation: FontVariation.BODY1 }} color={Color.BLACK}>
              {getEnvString('apiKeys.title')}
            </Text>
          </Layout.Horizontal>
          <Text
            font={{ variation: FontVariation.BODY }}
            color={Color.GREY_800}
            padding={{ top: 'small', bottom: 'small' }}
          >
            {getEnvString('apiKeys.message')}
          </Text>
          <Container className={css.content}>
            <Container className={css.table}>
              <RowContext.Provider
                value={{
                  environmentIdentifier: environment.identifier as string,
                  isNew: (id: string) => Boolean(recents?.find(r => r.identifier === id)),
                  onDelete: handleDelete,
                  getSecret: (id: string, fallback: string) =>
                    recents?.find(r => r.identifier === id)?.apiKey || fallback
                }}
              >
                <TableV2<ApiKey> data={(apiKeys || []) as ApiKey[]} columns={columns} />
              </RowContext.Provider>
            </Container>
          </Container>
        </Layout.Vertical>
      )}

      {emptyData && (
        <Container height="100%" flex={{ align: 'center-center' }}>
          <NoData
            imageURL={EmptySDKs}
            message={getString('cf.environments.apiKeys.noKeysFoundTitle')}
            description={<String useRichText stringID="cf.environments.apiKeys.noKeysFoundMessage" />}
          >
            <AddKeyDialog
              primary
              environment={environment}
              onCreate={(newKey: ApiKey, hideModal) => {
                updateApiKeyList(newKey)
                onNewKeyCreated()
                hideModal()
              }}
            />
          </NoData>
        </Container>
      )}
      {loading && <ContainerSpinner flex={{ align: 'center-center' }} />}
      {error && (
        <PageError
          message={getErrorMessage(error)}
          onClick={() => {
            updatePageNumber(0)
            refetch()
          }}
        />
      )}
    </Container>
  )
}

const CFEnvironmentDetailsBody: React.FC<EnvironmentDetailsBodyProps> = ({
  environment,
  onNewKeyCreated,
  refetch,
  error,
  loading,
  data,
  updatePageNumber,
  updateApiKeyList,
  recents
}) => {
  return (
    <Container className={css.envTabs}>
      <EnvironmentSDKKeys
        updatePageNumber={updatePageNumber}
        data={data}
        loading={loading}
        error={error}
        refetch={refetch}
        onNewKeyCreated={onNewKeyCreated}
        environment={environment}
        updateApiKeyList={updateApiKeyList}
        recents={recents}
      />
    </Container>
  )
}
export default CFEnvironmentDetailsBody
