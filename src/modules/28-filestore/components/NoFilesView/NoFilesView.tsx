/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'
import { Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import filestoreIllustration from '@filestore/images/no-files-state.svg'
import { useStrings } from 'framework/strings'
import { NewFileButton } from '@filestore/common/NewFile/NewFile'

import css from './NoFilesView.module.scss'

export interface NoFilesViewProps {
  onUpload?: () => void
  title: string
  description?: string
  customImgSrc?: string
}

export default function NoFilesView({ title, description = '', customImgSrc }: NoFilesViewProps): React.ReactElement {
  const { getString } = useStrings()
  const imgSrc = defaultTo(customImgSrc, filestoreIllustration)
  return (
    <Container height={'100%'}>
      <Layout.Vertical spacing={'xxlarge'} height={'100%'} flex={{ align: 'center-center' }}>
        <img src={imgSrc} width={'220px'} />
        <Container>
          <Text font={{ weight: 'bold', size: 'medium', align: 'center' }} color={Color.GREY_600}>
            {title}
          </Text>
          <Container className={css.descriptions}>
            {description && (
              <Text font={{ size: 'normal', align: 'center' }} color={Color.GREY_600}>
                {description}
              </Text>
            )}
            <Text font={{ size: 'normal' }} color={Color.GREY_600}>
              {getString('filestore.noFilesDescription')}
            </Text>
          </Container>
        </Container>
        <NewFileButton />
      </Layout.Vertical>
    </Container>
  )
}
