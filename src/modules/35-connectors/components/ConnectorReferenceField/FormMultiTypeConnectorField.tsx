/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useState } from 'react'
import cx from 'classnames'
import {
  ExpressionAndRuntimeTypeProps,
  getMultiTypeFromValue,
  MultiTypeInputValue,
  MultiTypeInputType,
  DataTooltipInterface,
  HarnessDocTooltip,
  Container,
  FormError,
  FormikTooltipContext,
  useToaster,
  ButtonVariation
} from '@wings-software/uicore'
import { connect, FormikContextType } from 'formik'
import { Classes, FormGroup, Intent } from '@blueprintjs/core'
import { get, isEmpty } from 'lodash-es'
import useCreateConnectorModal from '@connectors/modals/ConnectorModal/useCreateConnectorModal'
import useCreateConnectorMultiTypeModal from '@connectors/modals/ConnectorModal/useCreateConnectorMultiTypeModal'
import {
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  ConnectorResponse,
  ResponsePageConnectorResponse,
  useGetConnector
} from 'services/cd-ng'
import { ConfigureOptions, ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useStrings } from 'framework/strings'
import { errorCheck } from '@common/utils/formikHelpers'
import {
  getIdentifierFromValue,
  getScopeFromDTO,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import {
  MultiTypeReferenceInput,
  MultiTypeReferenceInputProps,
  ReferenceSelectProps
} from '@common/components/ReferenceSelect/ReferenceSelect'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacButton from '@rbac/components/Button/Button'
import {
  ConnectorReferenceFieldProps,
  getReferenceFieldProps,
  getEditRenderer,
  InlineSelectionInterface,
  ConnectorSelectedValue,
  getSelectedRenderer,
  getConnectorStatusCall
} from './ConnectorReferenceField'
import css from './ConnectorReferenceField.module.scss'

export interface MultiTypeConnectorFieldConfigureOptionsProps
  extends Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName'> {
  variableName?: ConfigureOptionsProps['variableName']
}
export interface MultiTypeConnectorFieldProps extends Omit<ConnectorReferenceFieldProps, 'onChange'> {
  onChange?: ExpressionAndRuntimeTypeProps['onChange']
  formik?: FormikContextType<any>
  multiTypeProps?: Omit<MultiTypeReferenceInputProps<ConnectorReferenceDTO>, 'name' | 'referenceSelectProps'>
  isNewConnectorLabelVisible?: boolean
  createNewLabel?: string
  configureOptionsProps?: MultiTypeConnectorFieldConfigureOptionsProps
  enableConfigureOptions?: boolean
  setRefValue?: boolean
  style?: React.CSSProperties
  tooltipProps?: DataTooltipInterface
  multitypeInputValue?: MultiTypeInputType
  connectorLabelClass?: string
  onLoadingFinish?: () => void
}
export interface ConnectorReferenceDTO extends ConnectorInfoDTO {
  status: ConnectorResponse['status']
}

export const MultiTypeConnectorField = (props: MultiTypeConnectorFieldProps): React.ReactElement => {
  const {
    defaultScope,
    accountIdentifier,
    projectIdentifier,
    orgIdentifier,
    type = 'K8sCluster',
    category,
    name,
    label,
    setRefValue = false,
    onChange,
    width = 400,
    formik,
    placeholder,
    isNewConnectorLabelVisible = true,
    configureOptionsProps,
    enableConfigureOptions = true,
    style,
    gitScope,
    multiTypeProps = {},
    multitypeInputValue,
    connectorLabelClass: connectorLabelClassFromProps = '',
    createNewLabel,
    ...restProps
  } = props
  const hasError = errorCheck(name, formik)
  const {
    intent = hasError ? Intent.DANGER : Intent.NONE,
    helperText = hasError ? <FormError name={name} errorMessage={get(formik?.errors, name)} /> : null,
    disabled,
    ...rest
  } = restProps
  const selected = get(formik?.values, name, '')
  const [selectedValue, setSelectedValue] = React.useState(selected)
  const [inlineSelection, setInlineSelection] = React.useState<InlineSelectionInterface>({
    selected: false,
    inlineModalClosed: false
  })
  const scopeFromSelected =
    typeof selectedValue === 'string' && selectedValue.length > 0
      ? getScopeFromValue(selectedValue || '')
      : selected.length > 0
      ? getScopeFromValue(selected || '')
      : selectedValue?.scope
  const selectedRef =
    typeof selected === 'string' ? getIdentifierFromValue(selected || '') : selectedValue?.connector?.identifier

  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    props.tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  const [multiType, setMultiType] = React.useState<MultiTypeInputType>(MultiTypeInputType.FIXED)
  const [connectorStatusCheckInProgress, setConnectorStatusCheckInProgress] = React.useState(false)
  const [connectorStatus, setConnectorStatus] = React.useState(typeof selected !== 'string' && selected?.live)

  const [isConnectorEdited, setIsConnectorEdited] = useState(false)
  const { showError } = useToaster()
  const getConnectorStatus = (): void => {
    if (typeof selected !== 'string') {
      setConnectorStatusCheckInProgress(true)
      getConnectorStatusCall(selected, accountIdentifier)
        .then(
          status => {
            setConnectorStatus(status)
          },
          err => {
            setConnectorStatus(false)
            showError(err)
          }
        )
        .finally(() => {
          setConnectorStatusCheckInProgress(false)
          setIsConnectorEdited(false)
        })
    }
  }
  const {
    data: connectorData,
    loading,
    refetch,
    error
  } = useGetConnector({
    identifier: selectedRef as string,
    queryParams: {
      accountIdentifier,
      orgIdentifier: scopeFromSelected === Scope.ORG || scopeFromSelected === Scope.PROJECT ? orgIdentifier : undefined,
      projectIdentifier: scopeFromSelected === Scope.PROJECT ? projectIdentifier : undefined,
      ...(!isEmpty(gitScope?.repo) && !isEmpty(gitScope?.branch)
        ? {
            branch: gitScope?.branch,
            repoIdentifier: gitScope?.repo,
            getDefaultFromOtherRepo: true
          }
        : {})
    },
    lazy: true
  })
  const [canUpdate] = usePermission(
    {
      resource: {
        resourceType: ResourceType.CONNECTOR
      },
      permissions: [PermissionIdentifier.UPDATE_CONNECTOR]
    },
    []
  )

  React.useEffect(() => {
    if (multiType === MultiTypeInputType.FIXED && getMultiTypeFromValue(selected) === MultiTypeInputType.FIXED) {
      if (typeof selected === 'string' && selected.length > 0) {
        refetch()
      }
      if (multitypeInputValue !== undefined) {
        setSelectedValue(selected)
      }
    } else {
      setSelectedValue(selected)
    }
    if (typeof selected !== 'string' && selected && (selected as ConnectorSelectedValue).connector) {
      if (isConnectorEdited) {
        getConnectorStatus()
      } else {
        setConnectorStatus((selected as ConnectorSelectedValue).live)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  React.useEffect(() => {
    if (typeof selected === 'string' && getMultiTypeFromValue(selected) === MultiTypeInputType.FIXED && !loading) {
      if (connectorData && connectorData?.data?.connector?.name) {
        const scope = getScopeFromValue(selected || '')
        const value = {
          label: connectorData?.data?.connector?.name,
          value:
            scope === Scope.ORG || scope === Scope.ACCOUNT
              ? `${scope}.${connectorData?.data?.connector?.identifier}`
              : connectorData?.data?.connector?.identifier,
          scope: scope,
          live: connectorData?.data?.status?.status === 'SUCCESS',
          connector: connectorData?.data?.connector
        }
        if (!setRefValue) {
          formik?.setFieldValue(name, value)
        }
        setSelectedValue(value)
        props?.onLoadingFinish?.()
      } else if (error) {
        if (!setRefValue) {
          formik?.setFieldValue(name, '')
        }
        setSelectedValue('')
        props?.onLoadingFinish?.()
      }
    } else {
      // enabling for expressions/runtime
      !loading && props?.onLoadingFinish?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])
  const { getString } = useStrings()

  function onConnectorCreateSuccess(data?: ConnectorConfigDTO): void {
    if (data) {
      setIsConnectorEdited(true)
      const scope = getScopeFromDTO<ConnectorConfigDTO>(data.connector)
      const val = {
        label: data.connector.name,
        value:
          scope === Scope.ORG || scope === Scope.ACCOUNT
            ? `${scope}.${data.connector.identifier}`
            : data.connector.identifier,
        scope,
        connector: data.connector,
        live: data?.status?.status === 'SUCCESS'
      }
      props.onChange?.(val, MultiTypeInputValue.SELECT_OPTION, MultiTypeInputType.FIXED)
      if (setRefValue) {
        formik?.setFieldValue(name, val.value)
      } else {
        formik?.setFieldValue(name, val)
      }
      setSelectedValue(val)
      setInlineSelection({
        selected: true,
        inlineModalClosed: false
      })
    }
  }

  const { openConnectorModal } = useCreateConnectorModal({
    onSuccess: onConnectorCreateSuccess,
    onClose: () => {
      setInlineSelection(prevState => {
        return { ...prevState, inlineModalClosed: true }
      })
    }
  })

  const { openConnectorMultiTypeModal } = useCreateConnectorMultiTypeModal({
    types: Array.isArray(type) ? type : [type],
    onSuccess: onConnectorCreateSuccess
  })

  const placeHolderLocal = loading ? getString('loading') : placeholder
  const isDisabled = loading || disabled

  const optionalReferenceSelectProps: Pick<
    ReferenceSelectProps<ConnectorConfigDTO>,
    'createNewHandler' | 'editRenderer'
  > = {}

  if (typeof type === 'string' && !category) {
    optionalReferenceSelectProps.createNewHandler = () => {
      openConnectorModal(false, type, {
        gitDetails: {
          repoIdentifier: gitScope?.repo,
          branch: gitScope?.branch,
          getDefaultFromOtherRepo: gitScope?.getDefaultFromOtherRepo || true
        }
      })
    }
  } else if (Array.isArray(type) && !category) {
    optionalReferenceSelectProps.createNewHandler = () => {
      openConnectorMultiTypeModal()
    }
  }

  const [canUpdateSelectedConnector] = usePermission(
    {
      resource: {
        resourceType: ResourceType.CONNECTOR,
        resourceIdentifier: selectedValue?.connector?.identifier || ''
      },
      permissions: [PermissionIdentifier.UPDATE_CONNECTOR]
    },
    []
  )

  if (typeof type === 'string' && typeof selectedValue === 'object') {
    optionalReferenceSelectProps.editRenderer = getEditRenderer(
      selectedValue,
      openConnectorModal,
      selectedValue?.connector?.type || type,
      getString,
      canUpdateSelectedConnector
    )
  } else if (Array.isArray(type) && typeof selectedValue === 'object') {
    optionalReferenceSelectProps.editRenderer = getEditRenderer(
      selectedValue,
      openConnectorModal,
      selectedValue?.connector?.type,
      getString,
      canUpdateSelectedConnector
    )
  }
  const [pagedConnectorData, setPagedConnectorData] = useState<ResponsePageConnectorResponse>({})
  const [page, setPage] = useState(0)
  const getReferenceFieldPropsValues = getReferenceFieldProps({
    defaultScope,
    gitScope,
    accountIdentifier,
    projectIdentifier,
    orgIdentifier,
    type,
    category,
    name,
    selected,
    width,
    placeholder: placeHolderLocal,
    label,
    getString,
    openConnectorModal,
    setPagedConnectorData
  })
  const component = (
    <FormGroup {...rest} labelFor={name} helperText={helperText} intent={intent} style={{ marginBottom: 0 }}>
      <MultiTypeReferenceInput<ConnectorReferenceDTO>
        name={name}
        disabled={isDisabled}
        referenceSelectProps={{
          ...getReferenceFieldPropsValues,
          // Only Github will have collapse view and not others.
          // Other connectors will need to onboard this and add details in collapsed view.
          // Please update the details in RenderConnectorDetails inside ConnectorReferenceField.
          disableCollapse: !(type === 'Github'),
          pagination: {
            itemCount: pagedConnectorData?.data?.totalItems || 0,
            pageSize: pagedConnectorData?.data?.pageSize || 10,
            pageCount: pagedConnectorData?.data?.totalPages || -1,
            pageIndex: page || 0,
            gotoPage: pageIndex => setPage(pageIndex)
          },
          isNewConnectorLabelVisible: canUpdate && isNewConnectorLabelVisible,
          selectedRenderer: getSelectedRenderer(selectedValue, !!connectorStatus, connectorStatusCheckInProgress),
          ...optionalReferenceSelectProps,
          disabled: isDisabled,
          hideModal: inlineSelection.selected && inlineSelection.inlineModalClosed,
          createNewLabel: createNewLabel || getString('newConnector'),
          createNewBtnComponent: (
            <RbacButton
              variation={ButtonVariation.SECONDARY}
              onClick={() => {
                optionalReferenceSelectProps.createNewHandler?.()
              }}
              text={`+ ${createNewLabel || getString('newConnector')}`}
              margin={{ right: 'small' }}
              permission={{
                permission: PermissionIdentifier.UPDATE_CONNECTOR,
                resource: {
                  resourceType: ResourceType.CONNECTOR
                },
                resourceScope: { accountIdentifier, orgIdentifier, projectIdentifier }
              }}
            ></RbacButton>
          )
        }}
        onChange={(val, valueType, type1) => {
          if (val && type1 === MultiTypeInputType.FIXED) {
            const { record, scope } = val as unknown as { record: ConnectorReferenceDTO; scope: Scope }
            const value = {
              label: record.name,
              value:
                scope === Scope.ORG || scope === Scope.ACCOUNT ? `${scope}.${record.identifier}` : record.identifier,
              scope,
              live: record?.status?.status === 'SUCCESS',
              connector: record
            }
            if (setRefValue) {
              formik?.setFieldValue(name, value.value)
            } else {
              formik?.setFieldValue(name, value)
            }
            setSelectedValue(value)
          } else {
            formik?.setFieldValue(name, val || '')
            setSelectedValue(val || '')
          }
          props?.onLoadingFinish?.()
          setMultiType(type1)
          onChange?.(val, valueType, type1)
        }}
        value={selectedValue}
        multitypeInputValue={multitypeInputValue}
        {...multiTypeProps}
      />
    </FormGroup>
  )

  return (
    <div style={style} className={cx(css.connectorLabel, connectorLabelClassFromProps)}>
      <Container style={{ marginBottom: 5 }}>
        <HarnessDocTooltip tooltipId={dataTooltipId} labelText={label} className={Classes.LABEL} />
      </Container>
      {enableConfigureOptions ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {component}
          {getMultiTypeFromValue(selected) === MultiTypeInputType.RUNTIME && (
            <ConfigureOptions
              value={selected}
              type={getString('string')}
              variableName={name}
              showRequiredField={false}
              showDefaultField={false}
              showAdvanced={true}
              onChange={val => {
                formik?.setFieldValue(name, val)
                onChange?.(val, MultiTypeInputValue.STRING, MultiTypeInputType.RUNTIME)
              }}
              style={{ marginLeft: 'var(--spacing-medium)' }}
              {...configureOptionsProps}
              isReadonly={props.disabled}
            />
          )}
        </div>
      ) : (
        component
      )}
    </div>
  )
}

export const FormMultiTypeConnectorField = connect(MultiTypeConnectorField)
