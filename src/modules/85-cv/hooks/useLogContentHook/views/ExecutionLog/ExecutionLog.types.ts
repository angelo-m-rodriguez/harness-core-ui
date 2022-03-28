/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@harness/uicore'
import type { ExecutionLogDTO, PageCVNGLogDTO } from 'services/cv'

export enum ActionType {
  SetExecutionLogs = 'SetExecutionLogs',
  ResetExecutionLogs = 'ResetExecutionLogs',
  Search = 'Search',
  ResetSearch = 'ResetSearch',
  GoToNextSearchResult = 'GoToNextSearchResult',
  GoToPrevSearchResult = 'GoToPrevSearchResult'
}

export type TextKeys = 'logLevel' | 'createdAt' | 'log'

export interface SearchData {
  text: string
  currentIndex: number
  linesWithResults: number[]
}

export interface LogLineData {
  text: Partial<Record<TextKeys, string>>
  searchIndices?: Partial<Record<TextKeys, number[]>>
}

export interface State {
  data: LogLineData[]
  searchData: SearchData
}

export interface Action<T extends ActionType> {
  type: ActionType
  payload: T extends ActionType.SetExecutionLogs ? ExecutionLogDTO[] : string
}

export interface UseActionCreatorReturn {
  setExecutionLogs(payload: ExecutionLogDTO[]): void
  resetExecutionLogs(): void
  search(payload: string): void
  resetSearch(): void
  goToNextSearchResult(): void
  goToPrevSearchResult(): void
}

export interface ExecutionLogProps {
  isFullScreen: boolean
  setIsFullScreen: (isFullScreen: boolean | ((isFullScreen: boolean) => boolean)) => void
  verifyStepExecutionId?: string
  serviceName?: string
  envName?: string
  resource?: PageCVNGLogDTO
  loading: boolean
  errorMessage?: string
  refetchLogs: () => Promise<void>
  healthSource?: SelectOption
  setHealthSource?: (healthSource: SelectOption) => void
  timeRange?: SelectOption
  setTimeRange?: (timeRange: SelectOption) => void
  errorLogsOnly: boolean
  setErrorLogsOnly: (errorLogsOnly: boolean) => void
  pageNumber: number
  setPageNumber: (pageNumber: number | ((_pageNumber: number) => number)) => void
}
