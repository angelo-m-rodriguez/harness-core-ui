/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { CellProps, Renderer } from 'react-table'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import { Container, Layout, Popover, Text, PageError } from '@wings-software/uicore'
import { PopoverInteractionKind } from '@blueprintjs/core'
import { PageSpinner, Table } from '@common/components'
import type { ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import {
  EnvBuildIdAndInstanceCountInfo,
  GetEnvBuildInstanceCountQueryParams,
  useGetEnvBuildInstanceCount
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { ActiveServiceInstancePopover } from '@cd/components/ServiceDetails/ActiveServiceInstances/ActiveServiceInstancePopover'
import MostActiveServicesEmptyState from '@cd/icons/MostActiveServicesEmptyState.svg'
import { numberFormatter } from '@cd/components/Services/common'
import css from '@cd/components/ServiceDetails/ActiveServiceInstances/ActiveServiceInstances.module.scss'

const TOTAL_VISIBLE_BUILDS = 5
const TOTAL_VISIBLE_INSTANCES = 10

type VisibleBuildCount = { [key: string]: number }

interface TableRowData {
  envId?: string
  envName?: string
  buildId?: string
  instanceCount?: number
  remainingCount?: number
  showEnvName: boolean
}

// returns a map of env id and total builds count
const initVisibleBuildCount = (
  envBuildIdAndInstanceCountInfo?: EnvBuildIdAndInstanceCountInfo[]
): VisibleBuildCount => {
  if (!envBuildIdAndInstanceCountInfo) {
    return {}
  }
  const visibleBuildCount: VisibleBuildCount = {}
  envBuildIdAndInstanceCountInfo.forEach(item => {
    if (item.envId) {
      visibleBuildCount[item.envId] = TOTAL_VISIBLE_BUILDS
    }
  })
  return visibleBuildCount
}

const getTableData = (
  envBuildIdAndInstanceCountInfo?: EnvBuildIdAndInstanceCountInfo[],
  visibleBuildCount?: VisibleBuildCount
): TableRowData[] => {
  const tableData: TableRowData[] = []
  if (!envBuildIdAndInstanceCountInfo || !visibleBuildCount) {
    return tableData
  }
  envBuildIdAndInstanceCountInfo.forEach(item => {
    const envId = item.envId
    if (envId) {
      const visibleRowsForEnv = visibleBuildCount[envId]
      const totalAvailableBuildsForEnv = item.buildIdAndInstanceCountList?.length || 0
      item.buildIdAndInstanceCountList?.slice(0, visibleRowsForEnv).forEach((row, index) => {
        tableData.push({
          showEnvName: !index,
          envId,
          envName: item.envName,
          buildId: row.buildId,
          instanceCount: row.count
        })
      })
      if (visibleRowsForEnv < totalAvailableBuildsForEnv) {
        tableData.push({ envId, remainingCount: totalAvailableBuildsForEnv - visibleRowsForEnv, showEnvName: false })
      }
    }
  })
  return tableData
}

const RenderEnvironment: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { envName, showEnvName }
  }
}) => {
  return showEnvName ? (
    <Container className={css.envContainer}>
      <Text className={css.environmentRow} font={{ size: 'small' }} color={Color.WHITE} lineClamp={1}>
        {envName}
      </Text>
    </Container>
  ) : (
    <></>
  )
}

const RenderBuildName: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { envId, buildId, remainingCount }
  },
  column
}) => {
  const { getString } = useStrings()
  const component = buildId ? (
    <Text font={{ size: 'small', weight: 'semi-bold' }} lineClamp={1} color={Color.GREY_800}>
      {buildId}
    </Text>
  ) : (
    <Text
      font={{ size: 'xsmall', weight: 'semi-bold' }}
      color={Color.PRIMARY_6}
      background={Color.PRIMARY_1}
      className={css.seeMore}
      onClick={() => (column as any)?.expandBuilds?.(envId)}
    >
      {getString('cd.serviceDashboard.seeMore', { count: numberFormatter(remainingCount) })}
    </Text>
  )
  return <Container className={css.paddedContainer}>{component}</Container>
}

const RenderInstanceCount: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { instanceCount }
  }
}) => {
  return instanceCount ? (
    <Container className={css.paddedContainer}>
      <Text
        font={{ size: 'xsmall', weight: 'bold' }}
        background={Color.GREY_100}
        className={cx(css.instanceCount, css.overflow)}
      >
        {numberFormatter(instanceCount)}
      </Text>
    </Container>
  ) : (
    <></>
  )
}

const RenderInstances: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { envId, buildId, instanceCount }
  }
}) => {
  return instanceCount ? (
    <Container className={cx(css.paddedContainer, css.hexContainer)} flex={{ justifyContent: 'flex-start' }}>
      {Array(Math.min(instanceCount, TOTAL_VISIBLE_INSTANCES))
        .fill(null)
        .map((_, index) => (
          <Popover
            interactionKind={PopoverInteractionKind.CLICK}
            key={index}
            modifiers={{ preventOverflow: { escapeWithReference: true } }}
          >
            <Container
              className={css.hex}
              width={18}
              height={18}
              background={Color.PRIMARY_3}
              margin={{ left: 'xsmall', right: 'xsmall', top: 'xsmall', bottom: 'xsmall' }}
            />
            <ActiveServiceInstancePopover buildId={buildId} envId={envId} instanceNum={index} />
          </Popover>
        ))}
      {instanceCount > TOTAL_VISIBLE_INSTANCES ? (
        <Text
          font={{ size: 'small', weight: 'semi-bold' }}
          color={Color.GREY_600}
          margin={{ left: 'xsmall' }}
        >{`+${numberFormatter(instanceCount - TOTAL_VISIBLE_INSTANCES)}`}</Text>
      ) : (
        <></>
      )}
    </Container>
  ) : (
    <></>
  )
}

export const ActiveServiceInstancesContent: React.FC = () => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier, serviceId } = useParams<ProjectPathProps & ServicePathProps>()

  // this state holds how many builds are visible for each environment, it updates as we click on show more button
  const [visibleBuildCount, setVisibleBuildCount] = useState<VisibleBuildCount>({})

  const queryParams: GetEnvBuildInstanceCountQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId
  }
  const { loading, data, error, refetch } = useGetEnvBuildInstanceCount({ queryParams })

  useEffect(() => {
    setVisibleBuildCount(initVisibleBuildCount(data?.data?.envBuildIdAndInstanceCountInfoList))
  }, [data, setVisibleBuildCount])

  const expandBuilds = useCallback((envId?: string): void => {
    if (!envId) {
      return
    }
    setVisibleBuildCount(prevVisibleBuildCount => ({
      ...prevVisibleBuildCount,
      [envId]: prevVisibleBuildCount[envId] + TOTAL_VISIBLE_BUILDS
    }))
  }, [])

  const columns = useMemo(() => {
    return [
      {
        Header: getString('environment'),
        id: 'service',
        width: '20%',
        Cell: RenderEnvironment
      },
      {
        Header: getString('cd.artifactVersion'),
        id: 'type',
        width: '23%',
        Cell: RenderBuildName,
        expandBuilds
      },
      {
        Header: '',
        id: 'serviceInstances',
        width: '10%',
        Cell: RenderInstanceCount
      },
      {
        Header: getString('common.instanceLabel'),
        id: 'deployments',
        width: '47%',
        Cell: RenderInstances
      }
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tableData: TableRowData[] = useMemo(
    () => getTableData(data?.data?.envBuildIdAndInstanceCountInfoList, visibleBuildCount),
    [data, visibleBuildCount]
  )

  if (loading || error || !(data?.data?.envBuildIdAndInstanceCountInfoList || []).length) {
    const component = (() => {
      if (loading) {
        return (
          <Container data-test="ActiveServiceInstancesLoader" height="360px">
            <PageSpinner />
          </Container>
        )
      }
      if (error) {
        return (
          <Container data-test="ActiveServiceInstancesError" height="360px">
            <PageError onClick={() => refetch()} />
          </Container>
        )
      }
      return (
        <Layout.Vertical
          height="360px"
          flex={{ align: 'center-center' }}
          data-test="ActiveServiceInstancesEmpty"
          className={css.activeServiceInstancesEmpty}
        >
          <Container margin={{ bottom: 'medium' }}>
            <img width="50" height="50" src={MostActiveServicesEmptyState} style={{ alignSelf: 'center' }} />
          </Container>
          <Text color={Color.GREY_400}>{getString('cd.serviceDashboard.noActiveServiceInstances')}</Text>
        </Layout.Vertical>
      )
    })()
    return component
  }

  return (
    <Layout.Horizontal padding={{ top: 'medium' }}>
      <Table<TableRowData> columns={columns} data={tableData} className={css.instanceTable} />
    </Layout.Horizontal>
  )
}
