/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useCallback, useMemo, useRef, SetStateAction, Dispatch } from 'react'
import { Intent, ProgressBar } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { get, omit } from 'lodash-es'
import { Button, Icon, Container, Text, useIsMounted, Layout, TableV2, ButtonVariation } from '@wings-software/uicore'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import type { CellProps, Column, Renderer } from 'react-table'
import type { orderType, sortType, serverSortProps } from '@common/components/Table/react-table-config'
import { TestSuite, useTestCaseSummary, TestCase, TestCaseSummaryQueryParams } from 'services/ti-service'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { CopyText } from '@common/components/CopyText/CopyText'
import { Duration } from '@common/exports'
import useExpandErrorModal from '@pipeline/components/ExpandErrorModal/useExpandErrorModal'
import { getOptionalQueryParamKeys, renderFailureRate } from './TestsUtils'
import { PopoverSection } from './TestsFailedPopover'
import css from './BuildTests.module.scss'

const NOW = Date.now()
const PAGE_SIZE = 10
const COPY_CLIPBOARD_ICON_WIDTH = 16
const SAFETY_TABLE_WIDTH = 216
const ORDER = 'order'
const STATUS = 'status'

const TestCaseColumns: { [key: string]: keyof TestCase } = {
  NAME: 'name',
  CLASS_NAME: 'class_name',
  RESULT: 'result',
  DURATION_MS: 'duration_ms'
}

interface SortByObjInterface {
  sort?: sortType
  order?: orderType
}
export interface TestExecutionEntryProps {
  buildIdentifier: string
  serviceToken: string
  executionSummary: TestSuite
  expanded?: boolean
  status?: 'failed'
  onExpand?: () => void
  stageId: string
  stepId: string
  onShowCallGraphForClass?: (classname: string) => void
  isUngroupedList: boolean
}

const getServerSort = ({
  queryParams,
  sort,
  sortByObj,
  setSortByObj,
  refetchData
}: {
  queryParams: TestCaseSummaryQueryParams
  sort?: any //'name' | 'class_name' | 'status' | 'duration_ms'
  sortByObj: SortByObjInterface
  setSortByObj: Dispatch<SetStateAction<SortByObjInterface>>
  refetchData: (queryParams: TestCaseSummaryQueryParams) => void
}): void => {
  const newQueryParams = { ...queryParams }
  let newOrder: orderType | undefined
  if (sort === sortByObj.sort && sortByObj.order) {
    newOrder = sortByObj.order === 'DESC' ? 'ASC' : 'DESC'
  } else {
    // no saved state for sortBy of the same sort type
    newOrder = 'ASC'
  }
  setSortByObj({ sort, order: newOrder })
  newQueryParams.sort = sort
  newQueryParams.order = newOrder
  refetchData(newQueryParams)
}

const getServerSortProps = ({
  enableServerSort,
  accessor,
  sortByObj,
  queryParams,
  refetchData,
  setSortByObj
}: {
  enableServerSort: boolean
  accessor: string
  sortByObj: SortByObjInterface
  queryParams: TestCaseSummaryQueryParams
  refetchData: (queryParams: TestCaseSummaryQueryParams) => void
  setSortByObj: Dispatch<SetStateAction<SortByObjInterface>>
}): serverSortProps => {
  if (!enableServerSort) {
    return { enableServerSort: false }
  } else {
    let sortName = accessor
    if (sortName === TestCaseColumns.RESULT) {
      sortName = STATUS
    }
    return {
      enableServerSort: true,
      isServerSorted: sortByObj.sort === sortName,
      isServerSortedDesc: sortByObj.order === 'DESC',
      getSortedColumn: ({ sort }: { sort?: sortType }) =>
        getServerSort({
          queryParams,
          sort: sort === TestCaseColumns.RESULT ? STATUS : sort,
          sortByObj,
          setSortByObj,
          refetchData
        })
    }
  }
}

const getColumnText = ({
  col,
  pageIndex,
  itemOrderNumber,
  row,
  openTestsFailedModal,
  closeTestsFailedModal,
  testCase,
  getString,
  failed
}: {
  col: keyof TestCase | typeof ORDER
  pageIndex: number
  itemOrderNumber: number
  row: { original: TestCase }
  openTestsFailedModal?: (errorContent: JSX.Element) => void
  closeTestsFailedModal?: () => void
  testCase: TestCase
  getString: UseStringsReturn['getString']
  failed: boolean
}): string | JSX.Element => {
  if (col === ORDER) {
    return PAGE_SIZE * pageIndex + itemOrderNumber + '.'
  } else if (col === TestCaseColumns.RESULT) {
    return (row.original[col] as any)?.status || ''
  } else if (col === TestCaseColumns.DURATION_MS) {
    return (
      <Duration
        icon={undefined}
        durationText=" "
        startTime={NOW}
        endTime={NOW + ((row.original[col] as number) || 0)}
        showMsLessThanOneSecond={true}
      />
    )
  } else if (col === TestCaseColumns.NAME) {
    const textToCopy = (row.original[col] as string) || ''
    const {
      name,
      class_name,
      result: { status = '', message, desc, type } = {},
      stderr: stacktrace,
      stdout: output
    } = testCase

    const errorContent = (
      <Layout.Vertical spacing="xlarge" padding="xlarge" className={css.testPopoverBody}>
        {name && <PopoverSection label={getString('pipeline.testsReports.testCaseName')} content={name} />}
        {class_name && <PopoverSection label={getString('pipeline.testsReports.className')} content={class_name} />}
        {status && <PopoverSection label={getString('pipeline.testsReports.status')} content={status} />}
        {type && <PopoverSection label={getString('pipeline.testsReports.type')} content={type} />}
        {message && <PopoverSection label={getString('pipeline.testsReports.failureMessage')} content={message} />}
        {desc && <PopoverSection label={getString('pipeline.testsReports.description')} content={desc} asPre={true} />}
        {stacktrace && <PopoverSection label={getString('pipeline.testsReports.stackTrace')} content={stacktrace} />}
        {output && <PopoverSection label={getString('pipeline.testsReports.consoleOutput')} content={output} />}
        <Button
          width={120}
          text={getString('close')}
          variation={ButtonVariation.PRIMARY}
          onClick={closeTestsFailedModal}
        />
      </Layout.Vertical>
    )
    return (
      <CopyText iconName="clipboard-alt" textToCopy={textToCopy}>
        <span
          className={cx(failed && css.expandErrorText)}
          onClick={e => {
            e.stopPropagation()
            if (failed) {
              openTestsFailedModal?.(errorContent)
            }
          }}
        >
          {row.original[col]}
        </span>
      </CopyText>
    )
  } else if (col === TestCaseColumns.CLASS_NAME) {
    const textToCopy = (row.original[col] as string) || ''
    return (
      <CopyText iconName="clipboard-alt" textToCopy={textToCopy}>
        {row.original[col]}
      </CopyText>
    )
  } else {
    return (row.original[col] as string) || ''
  }
}

function ColumnText({
  failed,
  col,
  pageIndex,
  itemOrderNumber,
  row,
  openTestsFailedModal,
  closeTestsFailedModal,
  testCase,
  getString
}: {
  failed: boolean
  col: keyof TestCase | typeof ORDER
  pageIndex: number
  itemOrderNumber: number
  row: { original: TestCase }
  openTestsFailedModal?: (errorContent: JSX.Element) => void
  closeTestsFailedModal?: () => void
  testCase: TestCase
  getString: UseStringsReturn['getString']
}): JSX.Element {
  return (
    <Text className={cx(css.text)} color={failed && col !== ORDER ? Color.RED_700 : Color.GREY_700}>
      {getColumnText({
        col,
        pageIndex,
        itemOrderNumber,
        row,
        openTestsFailedModal,
        closeTestsFailedModal,
        testCase,
        getString,
        failed
      })}
    </Text>
  )
}

export function TestsExecutionItem({
  buildIdentifier,
  serviceToken,
  executionSummary,
  expanded,
  status,
  onExpand,
  stageId,
  stepId,
  onShowCallGraphForClass,
  isUngroupedList
}: TestExecutionEntryProps): React.ReactElement {
  const containerRef = useRef<HTMLElement>(null)
  const rightSideContainerRef = useRef<HTMLElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const [titleWidth, setTitleWidth] = useState<number>()
  const [tableWidth, setTableWidth] = useState<number>()
  const [sortByObj, setSortByObj] = useState<SortByObjInterface>({})
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier, pipelineIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
    pipelineIdentifier: string
  }>()
  const [pageIndex, setPageIndex] = useState(0)
  const { openErrorModal, hideErrorModal } = useExpandErrorModal({})

  const queryParams = useMemo(() => {
    const optionalKeys = getOptionalQueryParamKeys({ stageId, stepId })

    return Object.assign(
      {
        accountId,
        orgId: orgIdentifier,
        projectId: projectIdentifier,
        buildId: buildIdentifier,
        pipelineId: pipelineIdentifier,
        report: 'junit' as const,
        suite_name: executionSummary.name,
        status,
        sort: 'status',
        order: 'ASC',
        pageIndex,
        pageSize: PAGE_SIZE
      },
      isUngroupedList ? { suite_name: executionSummary.name } : {},
      optionalKeys
    )
  }, [
    accountId,
    orgIdentifier,
    projectIdentifier,
    buildIdentifier,
    pipelineIdentifier,
    executionSummary.name,
    status,
    pageIndex,
    stageId,
    stepId,
    isUngroupedList
  ]) as TestCaseSummaryQueryParams

  const { data, error, loading, refetch } = useTestCaseSummary({
    queryParams,
    lazy: true,
    requestOptions: {
      headers: {
        'X-Harness-Token': serviceToken
      }
    }
  })
  const isMounted = useIsMounted()
  const [selectedRow, setSelectedRow] = useState<TestCase>()
  const refetchData = useCallback(
    (params: TestCaseSummaryQueryParams) => {
      setTimeout(() => {
        if (isMounted.current) {
          refetch({ queryParams: params })
        }
      }, 250)
    },
    [isMounted, refetch]
  )
  const renderColumn = useMemo(
    () =>
      ({
        col,
        openTestsFailedModal,
        closeTestsFailedModal
      }: {
        col: keyof TestCase | typeof ORDER
        openTestsFailedModal?: (errorContent: JSX.Element) => void
        closeTestsFailedModal?: () => void
      }) => {
        let itemOrderNumber = 0
        return (props => {
          const { row, rows } = props
          const failed = ['error', 'failed'].includes(row.original?.result?.status || '')

          itemOrderNumber++

          if (itemOrderNumber > rows.length) {
            itemOrderNumber = 1
          }

          return (
            <Container width="90%" className={css.testCell}>
              <ColumnText
                failed={failed}
                col={col}
                pageIndex={pageIndex}
                itemOrderNumber={itemOrderNumber}
                row={row}
                openTestsFailedModal={openTestsFailedModal}
                closeTestsFailedModal={closeTestsFailedModal}
                testCase={row.original}
                getString={getString}
              />
            </Container>
          )
        }) as Renderer<CellProps<TestCase>>
      },
    [pageIndex]
  )

  const columns: Column<TestCase>[] = useMemo(() => {
    const nameClassNameWidth = tableWidth ? tableWidth * 0.5 - 185 : SAFETY_TABLE_WIDTH
    return [
      {
        Header: '#',
        accessor: ORDER as keyof TestCase,
        width: 50,
        Cell: renderColumn({ col: ORDER }),
        disableSortBy: true
      },
      {
        Header: getString('pipeline.testsReports.testCaseName').toUpperCase(),
        accessor: TestCaseColumns.NAME,
        width: nameClassNameWidth,
        Cell: renderColumn({
          col: TestCaseColumns.NAME,
          openTestsFailedModal: openErrorModal,
          closeTestsFailedModal: hideErrorModal
        }),
        disableSortBy: data?.content?.length === 1,
        openErrorModal,
        serverSortProps: getServerSortProps({
          enableServerSort: isUngroupedList,
          accessor: TestCaseColumns.NAME,
          sortByObj,
          queryParams,
          refetchData,
          setSortByObj
        })
      },
      {
        Header: getString('pipeline.testsReports.className').toUpperCase(),
        accessor: TestCaseColumns.CLASS_NAME,
        width: nameClassNameWidth,
        Cell: renderColumn({ col: TestCaseColumns.CLASS_NAME }),
        disableSortBy: data?.content?.length === 1,
        serverSortProps: getServerSortProps({
          enableServerSort: isUngroupedList,
          accessor: TestCaseColumns.CLASS_NAME,
          sortByObj,
          queryParams,
          refetchData,
          setSortByObj
        })
      },
      {
        Header: getString('pipeline.testsReports.result'),
        accessor: TestCaseColumns.RESULT,
        width: 100,
        Cell: renderColumn({ col: TestCaseColumns.RESULT }),
        disableSortBy: data?.content?.length === 1,
        serverSortProps: getServerSortProps({
          enableServerSort: isUngroupedList,
          accessor: TestCaseColumns.RESULT,
          sortByObj,
          queryParams,
          refetchData,
          setSortByObj
        })
      },
      {
        Header: getString('pipeline.duration').toUpperCase(),
        accessor: TestCaseColumns.DURATION_MS,
        width: 100,
        Cell: renderColumn({ col: TestCaseColumns.DURATION_MS }),
        disableSortBy: data?.content?.length === 1,
        serverSortProps: getServerSortProps({
          enableServerSort: isUngroupedList,
          accessor: TestCaseColumns.DURATION_MS,
          sortByObj,
          queryParams,
          refetchData,
          setSortByObj
        })
      }
    ]
  }, [getString, renderColumn, data?.content?.length])
  const failureRate = (executionSummary.failed_tests || 0) / (executionSummary.total_tests || 1)

  useEffect(() => {
    if (expanded && !data) {
      refetchData(queryParams)
    } else if (isUngroupedList && !data) {
      const newQueryParams = { ...omit(queryParams, ['suite_name']) }
      refetchData(newQueryParams)
    }
  }, [expanded, queryParams, refetchData, data])

  useEffect(() => {
    if (!loading && expanded && data?.content?.length && onShowCallGraphForClass) {
      setSelectedRow(data.content[0])
      onShowCallGraphForClass(data.content[0].class_name as string)
    } else if (!loading && expanded && data?.content?.length) {
      setSelectedRow(data.content[0])
    }
  }, [loading, expanded, data, onShowCallGraphForClass])

  useEffect(() => {
    if (containerRef.current && rightSideContainerRef.current) {
      const container = containerRef.current
      const containerWidth = container.offsetWidth
      const containerHorizontalPaddings =
        parseFloat(getComputedStyle(container).paddingLeft) + parseFloat(getComputedStyle(container).paddingRight)
      const containerWidthWithoutPaddings = containerWidth - containerHorizontalPaddings

      const rightSideContainer = rightSideContainerRef.current
      const rightSideContainerWidth = rightSideContainer.offsetWidth

      const CHEVRON_BUTTON_WIDTH = 40
      const SIDES_SPACING = 25
      const newTitleWidth =
        containerWidthWithoutPaddings -
        rightSideContainerWidth -
        CHEVRON_BUTTON_WIDTH -
        SIDES_SPACING -
        COPY_CLIPBOARD_ICON_WIDTH

      setTitleWidth(newTitleWidth)
    }
  }, [])

  useEffect(() => {
    const onResize = (): void => {
      if (tableRef?.current) {
        setTableWidth(tableRef.current.clientWidth)
      }
    }
    onResize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <Container className={cx(css.widget, css.testSuite, expanded && css.expanded)} padding="medium" ref={containerRef}>
      <Container flex className={css.headingContainer}>
        <Text
          className={cx(css.testSuiteHeading, css.main)}
          color={Color.GREY_500}
          style={{ flexGrow: 1, textAlign: 'left', justifyContent: 'flex-start' }}
        >
          {!isUngroupedList && (
            <>
              <Button minimal large icon={expanded ? 'chevron-down' : 'chevron-right'} onClick={() => onExpand?.()} />
              <Layout.Horizontal>
                <Text width={titleWidth} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  <CopyText iconName="clipboard-alt" textToCopy={executionSummary.name || ''}>
                    <Text tooltip={<Container padding="small">{executionSummary.name}</Container>}>
                      <span className={css.testSuiteName}>
                        {getString('pipeline.testsReports.testSuite')} {executionSummary.name}
                      </span>
                    </Text>
                  </CopyText>
                </Text>
              </Layout.Horizontal>
            </>
          )}
        </Text>
        <Container flex ref={rightSideContainerRef}>
          <Text
            className={cx(css.testSuiteHeading, css.withSeparator)}
            color={Color.GREY_500}
            font={{ size: 'small' }}
            padding={{ left: 'small', right: 'small' }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>{getString('total')}</span>
            <span>{executionSummary.total_tests}</span>
          </Text>
          <Text
            className={cx(css.testSuiteHeading, css.withSeparator)}
            color={Color.GREY_500}
            font={{ size: 'small' }}
            padding={{ left: 'small', right: 'small' }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>{getString('failed')}</span>
            <span>{executionSummary.failed_tests}</span>
          </Text>
          <Text
            className={cx(css.testSuiteHeading, css.withSeparator)}
            color={Color.GREY_500}
            font={{ size: 'small' }}
            padding={{ left: 'small', right: 'small' }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>{getString('common.failureRate')}</span>
            <span>{renderFailureRate(failureRate)}%</span>
          </Text>
          <Layout.Vertical spacing="xsmall" style={{ marginRight: 'var(--spacing-large)' }} flex>
            <Duration
              icon="time"
              durationText=" "
              startTime={NOW}
              endTime={NOW + (executionSummary.duration_ms || 0)}
              font={{ size: 'small' }}
              color={Color.GREY_500}
              iconProps={{ color: Color.GREY_500, size: 12 }}
              showZeroSecondsResult
            />
            <ProgressBar
              className={css.progressBar}
              animate={false}
              intent={failureRate > 0 ? Intent.DANGER : Intent.SUCCESS}
              stripes={false}
              value={failureRate || 1}
            />
          </Layout.Vertical>
        </Container>
      </Container>
      {expanded && (
        <>
          {loading && (
            <Container flex={{ align: 'center-center' }} padding="xlarge">
              <Icon name="spinner" size={24} color="blue500" />
            </Container>
          )}
          {!loading && error && (
            <Container flex={{ align: 'center-center' }} padding="large">
              <Text icon="error" color={Color.RED_500} iconProps={{ size: 16, color: Color.RED_500 }}>
                {get(error, 'data.error_msg', error?.message)}
              </Text>
            </Container>
          )}
          {!loading && !error && (
            <Container ref={tableRef}>
              <TableV2<TestCase>
                className={cx(css.testSuiteTable, !!onShowCallGraphForClass && css.clickable)}
                columns={columns}
                data={data?.content || []}
                getRowClassName={row => (row.original === selectedRow ? css.rowSelected : '')}
                sortable
                resizable={true}
                onRowClick={
                  onShowCallGraphForClass
                    ? row => {
                        setSelectedRow(row)
                        onShowCallGraphForClass(row.class_name as string)
                      }
                    : undefined
                }
                pagination={
                  (data?.data?.totalItems || 0) > PAGE_SIZE
                    ? {
                        itemCount: data?.data?.totalItems || 0,
                        pageSize: data?.data?.pageSize || 0,
                        pageCount: data?.data?.totalPages || 0,
                        pageIndex,
                        gotoPage: pageIdx => {
                          setPageIndex(pageIdx)
                          refetchData({
                            ...queryParams,
                            pageIndex: pageIdx
                          })
                        }
                      }
                    : undefined
                }
              />
            </Container>
          )}
        </>
      )}
    </Container>
  )
}
