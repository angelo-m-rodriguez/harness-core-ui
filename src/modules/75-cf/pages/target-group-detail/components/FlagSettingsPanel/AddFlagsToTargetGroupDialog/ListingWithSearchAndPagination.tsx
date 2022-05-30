/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback } from 'react'
import { Container, ExpandingSearchInput, Pagination } from '@harness/uicore'
import type { Feature, Features } from 'services/cf'
import { useStrings } from 'framework/strings'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { NoData } from '@cf/components/NoData/NoData'
import imageUrl from '@cf/images/Feature_Flags_Teepee.svg'
import { AddFlagsToTargetGroupDialogStatus as STATUS } from '@cf/pages/target-group-detail/TargetGroupDetailPage.types'
import TargetManagementFlagsListing from '@cf/components/TargetManagementFlagsListing/TargetManagementFlagsListing'
import css from './ListingWithSearchAndPagination.module.scss'

export interface ListingWithSearchAndPaginationProps {
  state: STATUS
  onSearch: (searchTerm: string) => void
  flags: Features
  setPageNumber: (pageNumber: number) => void
  isFlagAdded: (identifier: Feature['identifier']) => boolean
}

const ListingWithSearchAndPagination: FC<ListingWithSearchAndPaginationProps> = ({
  state,
  onSearch,
  flags,
  setPageNumber,
  isFlagAdded
}) => {
  const { getString } = useStrings()

  const disableRowVariations = useCallback(({ identifier }) => !isFlagAdded(identifier), [isFlagAdded])

  return (
    <div className={css.layout}>
      <ExpandingSearchInput width="60%" alwaysExpanded onChange={onSearch} />

      <div className={css.body}>
        {state === STATUS.loading && <ContainerSpinner flex={{ align: 'center-center' }} />}

        {state === STATUS.noSearchResults && (
          <Container height="100%" flex={{ align: 'center-center' }}>
            <NoData imageURL={imageUrl} message={getString('cf.noResultMatch')} />
          </Container>
        )}

        {(state === STATUS.ok || state === STATUS.submitting) && (
          <TargetManagementFlagsListing
            flags={flags.features || []}
            includePercentageRollout
            includeAddFlagCheckbox
            disableRowVariations={disableRowVariations}
          />
        )}
      </div>

      {state !== STATUS.noSearchResults && (
        <Pagination
          pageSize={flags.pageSize}
          pageCount={flags.pageCount}
          itemCount={flags.itemCount}
          pageIndex={flags.pageIndex}
          gotoPage={setPageNumber}
          hidePageNumbers={flags.pageCount > 4}
        />
      )}
    </div>
  )
}

export default ListingWithSearchAndPagination
