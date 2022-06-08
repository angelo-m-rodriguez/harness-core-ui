/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Avatar,
  AvatarGroup,
  Button,
  ButtonVariation,
  Card,
  Container,
  Icon,
  Layout,
  MultiSelect,
  MultiSelectOption,
  Select,
  SelectOption,
  SimpleTagInput,
  Text,
  TextInput
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color } from '@harness/design-system'
import { isEqual, omit } from 'lodash-es'
import { Dialog, Divider, Spinner } from '@blueprintjs/core'
import { useToaster } from '@common/exports'
import { useStrings } from 'framework/strings'
import { IsSingleValued, useOperatorsFromYaml } from '@cf/constants'
import {
  Clause,
  GetAllTargetsQueryParams,
  PatchSegmentQueryParams,
  Segment,
  Target,
  useGetAllTargets,
  usePatchSegment
} from 'services/cf'
import { getErrorMessage } from '@cf/utils/CFUtils'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import patch, { getDiff } from '../../utils/instructions'
import SegmentRulesEditButton from './segment-rules-edit-button/SegmentRulesEditButton'
import css from './SegmentDetailsPage.module.scss'

const AddTargetAvatar: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <Avatar name="+" color={Color.BLUE_500} backgroundColor={Color.GREY_200} onClick={onAdd} />
)

const InlineBold: React.FC<{ children: string | string[] }> = ({ children }) => (
  <span style={{ fontWeight: 'bold' }}>{children}</span>
)
const safeJoin = (data: any[], separator: string): string => data?.join(separator) || `[${data}]`
interface ClauseProps {
  clause: Clause
  operators: {
    label: string
    value: string
  }[]
}
const ClauseViewMode: React.FC<ClauseProps> = ({ clause, operators }) => {
  return (
    <>
      If
      <InlineBold>{` ${clause.attribute} `} </InlineBold>{' '}
      {operators.find(op => op.value === clause.op)?.label || 'NO_OP'}{' '}
      <InlineBold>{` ${safeJoin(clause.values, ', ')}`}</InlineBold>
    </>
  )
}

type ClauseMutation =
  | { kind: 'op'; payload: string }
  | { kind: 'attribute'; payload: string }
  | { kind: 'values'; payload: string[] }

type ClauseEditProps = {
  index: number
  operator: string
  operators: {
    label: string
    value: string
  }[]
  attribute: string
  values: string[]
  error?: { attribute?: boolean; values?: boolean }
  isSingleValued: IsSingleValued
  onChange: (data: ClauseMutation) => void
}

const ClauseEditMode: React.FC<ClauseEditProps> = ({
  index,
  operator,
  operators,
  attribute,
  values,
  error,
  isSingleValued,
  onChange
}) => {
  const valueOpts = (values ?? []).map(toOption)
  const handleAttrChange = (e: React.ChangeEvent<HTMLInputElement>): void =>
    onChange({ kind: 'attribute', payload: e.target.value })
  const handleOperatorChange = (data: SelectOption): void => {
    onChange({ kind: 'op', payload: data.value as string })
    if (isSingleValued(data.value as string)) {
      onChange({ kind: 'values', payload: [values[0]] })
    }
  }
  const handleValuesChange = (data: MultiSelectOption[]): void =>
    onChange({
      kind: 'values',
      payload: data.map(x => (x.value as string).trim()).filter(x => x.length)
    })
  const handleSingleValueChange = (e: React.ChangeEvent<HTMLInputElement>): void =>
    handleValuesChange([toOption(e.target.value)])

  const height = '36px'

  return (
    <Layout.Horizontal spacing="xsmall">
      <Text
        color={Color.GREY_350}
        font="normal"
        style={{ display: 'flex', height, alignItems: 'center', justifyContent: 'flex-end' }}
      >
        {'If '}
      </Text>
      <div style={{ flex: '1' }}>
        <TextInput
          style={{ height }}
          id={`attribute-${index}`}
          value={attribute}
          onChange={handleAttrChange}
          intent={error?.attribute ? 'danger' : 'none'}
        />
      </div>
      <div style={{ flex: '1' }}>
        <Select
          inputProps={{ style: { height } }}
          value={operators.find(o => o.value === operator)}
          items={operators}
          onChange={handleOperatorChange}
        />
      </div>
      <div style={{ flex: '1.5' }}>
        {isSingleValued(operator) ? (
          <TextInput
            style={{ height }}
            id={`value-${index}`}
            value={valueOpts[0]?.value}
            onChange={handleSingleValueChange}
          />
        ) : (
          <MultiSelect
            fill
            className={css.valueMultiselect}
            tagInputProps={{
              className: css.valueMultiselect,
              inputProps: { className: css.valueMultiselect, intent: error?.values ? 'danger' : 'none' }
            }}
            items={valueOpts}
            value={valueOpts}
            onChange={handleValuesChange}
          />
        )}
      </div>
    </Layout.Horizontal>
  )
}

interface AvatarOption {
  name: string
}
interface Option<T> {
  label: string
  value: T
}
const toAvatar = (x: string): AvatarOption => ({ name: x })
const toOption = (x: string): Option<string> => ({ value: x, label: x })

interface RulesTabProps {
  excluded: string[]
  included: string[]
  availableTargets: string[]
  loadingTargets: boolean
  rules: Clause[]
  editing: boolean
  loadingSave: boolean
  errors?: RuleErrors
  setErrors: (errors: RuleErrors) => void
  onChangeIncluded: (data: string[]) => void
  onChangeExcluded: (data: string[]) => void
  onChangeRules: (data: Clause[]) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

const RulesTab: React.FC<RulesTabProps> = ({
  excluded,
  included,
  rules,
  availableTargets,
  loadingTargets,
  editing,
  loadingSave,
  errors,
  setErrors,
  onChangeIncluded,
  onChangeExcluded,
  onChangeRules,
  onEdit,
  onSave,
  onCancel
}) => {
  const { getString } = useStrings()
  const [operators, isSingleValued] = useOperatorsFromYaml()

  const [tempIncluded, setTempIncluded] = useState(included.map(toOption))

  const [openIncluded, hideIncluded] = useModalHook(() => {
    const handleTempIncludedChange = (newData: any): void => {
      setTempIncluded(newData.map((x: any) => (typeof x === 'string' ? toOption(x) : x)))
    }

    const handleSaveTempIncluded = (): void => {
      onChangeIncluded(tempIncluded.map(x => x.value))
      hideIncluded()
    }

    const handleCancelIncluded = (): void => {
      setTempIncluded(included.map(toOption))
      hideIncluded()
    }

    return (
      <Dialog enforceFocus={false} isOpen onClose={hideIncluded} title={`Serve variation to the following`}>
        <Layout.Vertical spacing="medium" padding={{ left: 'large', right: 'medium' }}>
          {loadingTargets ? (
            <Spinner size={24} />
          ) : (
            <SimpleTagInput
              fill
              allowNewTag={false}
              selectedItems={tempIncluded}
              items={availableTargets.map(toOption)}
              onChange={handleTempIncludedChange}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Button intent="primary" onClick={handleSaveTempIncluded}>
              {getString('done')}
            </Button>
            <Button minimal onClick={handleCancelIncluded}>
              {getString('cancel')}
            </Button>
            <div style={{ marginLeft: 'auto' }}>
              <Text>{`${tempIncluded.length} total`}</Text>
            </div>
          </div>
        </Layout.Vertical>
      </Dialog>
    )
  }, [tempIncluded, availableTargets])

  const [tempExcluded, setTempExcluded] = useState(excluded.map(toOption))
  const [openExcluded, hideExcluded] = useModalHook(() => {
    const handleTempExcludedChange = (newData: any): void => {
      setTempExcluded(newData.map((x: any) => (typeof x === 'string' ? toOption(x) : x)))
    }

    const handleSaveTempExcluded = (): void => {
      onChangeExcluded(tempExcluded.map(x => x.value))
      hideExcluded()
    }

    const handleCancelExcluded = (): void => {
      setTempExcluded(excluded.map(toOption))
      hideExcluded()
    }

    return (
      <Dialog enforceFocus={false} isOpen onClose={hideExcluded} title={`Serve variation to the following`}>
        <Layout.Vertical spacing="medium" padding={{ left: 'large', right: 'medium' }}>
          {loadingTargets ? (
            <Spinner size={24} />
          ) : (
            <SimpleTagInput
              fill
              allowNewTag={false}
              selectedItems={tempExcluded}
              items={availableTargets.map(toOption)}
              onChange={handleTempExcludedChange}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Button intent="primary" onClick={handleSaveTempExcluded}>
              {getString('done')}
            </Button>
            <Button minimal onClick={handleCancelExcluded}>
              {getString('cancel')}
            </Button>
            <div style={{ marginLeft: 'auto' }}>
              <Text>{`${tempExcluded.length} total`}</Text>
            </div>
          </div>
        </Layout.Vertical>
      </Dialog>
    )
  }, [tempExcluded, availableTargets])

  const [includedAvatars, excludedAvatars] = [included, excluded].map(x => x.map(toAvatar))

  const handleClauseChange =
    (idx: number) =>
    ({ kind, payload }: ClauseMutation) => {
      if (errors?.[idx]) {
        errors[idx] = {}
        setErrors(errors)
      }
      rules[idx] = {
        ...rules[idx],
        [kind]: payload
      }
      onChangeRules([...rules])
    }

  const handleNewClause = (): void => {
    onChangeRules([
      ...rules,
      {
        id: '',
        op: 'starts_with',
        attribute: '',
        values: [],
        negate: false
      }
    ])
  }

  const handleDelete = (idx: number) => () => {
    onChangeRules(rules.filter((_, index) => index !== idx))
  }

  return (
    <Layout.Vertical spacing="medium" padding="large">
      <Layout.Horizontal style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        {!editing && <SegmentRulesEditButton onEdit={onEdit} />}
      </Layout.Horizontal>
      <Card style={{ width: '100%', padding: 'var(--spacing-medium)' }}>
        <Layout.Vertical spacing="small">
          <Text font={{ size: 'medium', weight: 'bold' }}>Individual Targets</Text>
          <Layout.Horizontal
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}
            padding="small"
          >
            <Text>Include the following:</Text>{' '}
            {editing && includedAvatars.length === 0 ? (
              <AddTargetAvatar onAdd={openIncluded} />
            ) : (
              <AvatarGroup overlap avatars={includedAvatars} onAdd={editing ? openIncluded : undefined} />
            )}
          </Layout.Horizontal>
          <Divider />
          <Layout.Horizontal
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}
            padding="small"
          >
            <Text>Exclude the following:</Text>{' '}
            {editing && excludedAvatars.length === 0 ? (
              <AddTargetAvatar onAdd={openExcluded} />
            ) : (
              <AvatarGroup overlap avatars={excludedAvatars} onAdd={editing ? openExcluded : undefined} />
            )}
          </Layout.Horizontal>
        </Layout.Vertical>
        {}
      </Card>
      {rules.map((clause, idx) => {
        const hasError = Boolean(errors?.[idx]?.attribute || errors?.[idx]?.values)
        const errorMsg = [errors?.[idx]?.attribute && 'Attribute', errors?.[idx]?.values && 'Values']
          .filter(Boolean)
          .join(' and ')
          .concat(' required')

        return (
          <Layout.Horizontal spacing="medium" flex={{ align: 'center-center' }} width="100%" key={idx}>
            <Card style={{ flexGrow: 1 }}>
              {editing ? (
                <ClauseEditMode
                  key={idx}
                  index={idx}
                  attribute={clause.attribute}
                  operator={clause.op}
                  operators={operators}
                  values={clause.values}
                  error={errors?.[idx]}
                  isSingleValued={isSingleValued}
                  onChange={handleClauseChange(idx)}
                />
              ) : (
                <ClauseViewMode key={idx} clause={clause} operators={operators} />
              )}
              {hasError && <Text intent="danger">{errorMsg}</Text>}
            </Card>
            {editing && (
              <Icon
                name="trash"
                size={24}
                color={Color.GREY_300}
                onClick={handleDelete(idx)}
                style={{ cursor: 'pointer', height: 'fit-content' }}
              />
            )}
          </Layout.Horizontal>
        )
      })}
      {editing && (
        <Text color={Color.AQUA_500} onClick={handleNewClause} style={{ cursor: 'pointer' }}>
          + Check for condition and include target to segment
        </Text>
      )}
      {editing && (
        <Layout.Horizontal spacing="small" padding="medium" style={{ marginTop: 'auto' }}>
          <Button
            text="Save"
            intent="primary"
            variation={ButtonVariation.PRIMARY}
            onClick={() => {
              onSave()
            }}
          />
          <Button
            minimal
            text="Cancel"
            variation={ButtonVariation.TERTIARY}
            onClick={() => {
              onCancel()
            }}
          />
          {loadingSave && <Spinner size={24} />}
        </Layout.Horizontal>
      )}
    </Layout.Vertical>
  )
}

type TempSegment = {
  excluded: string[]
  included: string[]
  rules: Clause[]
}

type SegmentMutation =
  | { type: 'included'; payload: string[] }
  | { type: 'excluded'; payload: string[] }
  | { type: 'rules'; payload: Clause[] }
  | { type: 'set'; payload: TempSegment }

type MutationType = 'included' | 'excluded' | 'rules'

const toIdentifiers = (targets?: Target[]): string[] => targets?.map(target => target.identifier) || []

const tempSegmentReducer = (state: TempSegment, action: SegmentMutation) => {
  switch (action.type) {
    case 'included':
    case 'excluded':
    case 'rules':
      return {
        ...state,
        [action.type]: action.payload
      }
    case 'set':
      return action.payload
  }
}

const setIncluded = (payload: string[]): SegmentMutation => ({ type: 'included', payload })
const setExcluded = (payload: string[]): SegmentMutation => ({ type: 'excluded', payload })
const setRules = (payload: Clause[]): SegmentMutation => ({ type: 'rules', payload })
const setTempSegment = (payload: TempSegment): SegmentMutation => ({ type: 'set', payload })

type RuleErrors = {
  [K: number]: {
    attribute?: boolean
    values?: boolean
  }
}

const validateRules = (rules: Clause[]): [boolean, RuleErrors] => {
  let valid = true
  const ruleErr = rules.reduce((errors: RuleErrors, rule: Clause, idx: number) => {
    if (!rule.attribute.length) {
      valid = false
      errors[idx] = {
        attribute: true
      }
    }
    if (!rule.values.length) {
      valid = false
      errors[idx] = {
        ...(errors[idx] || {}),
        values: true
      }
    }
    return errors
  }, {} as RuleErrors)
  return [valid, ruleErr]
}

export const SegmentRules: React.FC<{ segment: Segment; onUpdate: () => void }> = ({ segment, onUpdate }) => {
  const { showError } = useToaster()
  const [editing, setEditing] = useState(false)
  const [errors, setErrors] = useState<RuleErrors>({})
  const { orgIdentifier, accountId: accountIdentifier } = useParams<Record<string, string>>()
  const { projectIdentifier, segmentIdentifier: identifier } = useParams<any>()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()

  const { data: rawTargets, loading: loadingTargets } = useGetAllTargets({
    queryParams: {
      environmentIdentifier,
      projectIdentifier,
      accountIdentifier,
      orgIdentifier
    } as GetAllTargetsQueryParams
  })

  const { mutate: sendPatch, loading: loadingPatch } = usePatchSegment({
    identifier,
    queryParams: {
      environmentIdentifier,
      projectIdentifier,
      accountIdentifier,
      orgIdentifier
    } as PatchSegmentQueryParams
  })

  const targets = rawTargets?.targets?.map(t => t.identifier || '') || []

  const [tempSegment, dispatch] = useReducer(tempSegmentReducer, {
    included: [...(segment.included || [])].map(target => target.identifier),
    excluded: [...(segment.excluded || [])].map(target => target.identifier),
    rules: [...(segment.rules || [])]
  })

  useEffect(() => {
    dispatch(
      setTempSegment({
        included: toIdentifiers([...(segment.included || [])]),
        excluded: toIdentifiers([...(segment.excluded || [])]),
        rules: [...(segment.rules || [])]
      })
    )
  }, [segment.included, segment.excluded, segment.rules])

  const handleSegmentChange = (type: MutationType) => (newData: any) => {
    if (type === 'included') {
      dispatch(setIncluded(newData))
    } else if (type === 'excluded') {
      dispatch(setExcluded(newData))
    } else if (type === 'rules') {
      dispatch(setRules(newData))
    }
  }

  const handleValid = (): void => {
    const instructions = []
    const [addedToInc, removedFromInc] = getDiff(toIdentifiers(segment.included), tempSegment.included)
    const [addedToExc, removedFromExc] = getDiff(toIdentifiers(segment.excluded), tempSegment.excluded)

    removedFromExc.length > 0 && instructions.push(patch.creators.removeFromExcludeList(removedFromExc))
    removedFromInc.length > 0 && instructions.push(patch.creators.removeFromIncludeList(removedFromInc))
    addedToExc.length > 0 && instructions.push(patch.creators.addToExcludeList(addedToExc))
    addedToInc.length > 0 && instructions.push(patch.creators.addToIncludeList(addedToInc))

    const removedClauses = (segment.rules || []).filter(c => !tempSegment.rules.find(x => x.id === c.id))
    const updatedClauses = (tempSegment.rules || []).filter(c => {
      const oldClause = segment.rules?.find(x => x.id === c.id)
      return oldClause && !isEqual(c, oldClause)
    })
    const newClauses = tempSegment.rules.filter(c => c.id === '')

    removedClauses.length > 0 &&
      instructions.push(...removedClauses.map(cl => patch.creators.removeClauseOnSegment(cl.id as string)))
    updatedClauses.length > 0 &&
      instructions.push(
        ...updatedClauses.map(cl =>
          patch.creators.updateClauseOnSegment({
            ...omit(cl, ['id', 'negate']),
            clauseID: cl.id as string
          })
        )
      )
    newClauses.length > 0 &&
      instructions.push(...newClauses.map(cl => patch.creators.addClauseToSegment(omit(cl, ['id']))))

    patch.segment.addAllInstructions(instructions)
    patch.segment
      .onPatchAvailable(patchData => {
        sendPatch(patchData)
          .then(() => {
            onUpdate()
            setEditing(false)
          })
          .catch(err => {
            showError(getErrorMessage(err), undefined, 'cf.send.patch.error')
          })
          .finally(() => patch.segment.reset())
      })
      .onEmptyPatch(() => setEditing(false))
  }

  const handleCancel = (): void => {
    patch.segment.reset()
    dispatch(
      setTempSegment({
        included: toIdentifiers([...(segment.included || [])]),
        excluded: toIdentifiers([...(segment.excluded || [])]),
        rules: [...(segment.rules || [])]
      })
    )
    setErrors({})
    setEditing(false)
  }

  const handleSave = (): void => {
    const [valid, newError] = validateRules(tempSegment.rules)
    if (valid) {
      handleValid()
    } else {
      setErrors(newError)
    }
  }

  if (loadingTargets) {
    return (
      <Container flex style={{ justifyContent: 'center', height: '100%' }}>
        <Spinner size={50} />
      </Container>
    )
  }

  return (
    <RulesTab
      availableTargets={targets}
      loadingTargets={loadingTargets}
      rules={tempSegment.rules || []}
      included={tempSegment.included}
      excluded={tempSegment.excluded}
      editing={editing}
      loadingSave={loadingPatch}
      errors={errors}
      setErrors={setErrors}
      onChangeIncluded={handleSegmentChange('included')}
      onChangeExcluded={handleSegmentChange('excluded')}
      onChangeRules={handleSegmentChange('rules')}
      onEdit={() => setEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
