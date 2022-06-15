/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text, IconName, Page, Heading, Container, Breadcrumb } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { IdentifierText } from '@cf/components/IdentifierText/IdentifierText'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import RbacOptionsMenuButton, {
  RbacOptionsMenuButtonProps
} from '@rbac/components/RbacOptionsMenuButton/RbacOptionsMenuButton'
import { StringKeys, useStrings } from 'framework/strings'

import css from './DetailPageTemplate.module.scss'

export interface DetailPageTemplateProps {
  breadcrumbs: Breadcrumb[]
  title: React.ReactNode
  titleIcon?: IconName | React.ReactNode
  subTitle?: string
  tags?: string[] | null | undefined
  identifier?: string

  /** Optional extra components to be added into header (context menu, edit button, etc...)  */
  /** Note: Use absolute position to style it */
  menuItems?: RbacOptionsMenuButtonProps['items']
  metaData?: Record<string, string>
  toolbar?: React.ReactNode
  footer?: React.ReactNode
}

export const DetailPageTemplate: React.FC<DetailPageTemplateProps> = ({
  breadcrumbs,
  title,
  subTitle,
  identifier,
  children,
  menuItems = [],
  metaData = {},
  toolbar,
  footer
}) => {
  const { getString } = useStrings()

  return (
    <main data-detail-page-container className={css.layout}>
      <Page.Header
        className={css.header}
        size="large"
        breadcrumbs={<NGBreadcrumbs customPathParams={{ module: 'cf' }} links={breadcrumbs} />}
        title={
          <>
            <Layout.Horizontal spacing="small">
              <Heading level={3} font={{ variation: FontVariation.H4 }}>
                {title}
              </Heading>
              {identifier && <IdentifierText identifier={identifier} allowCopy />}
            </Layout.Horizontal>
            {subTitle && (
              <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_400} padding={{ top: 'xsmall' }}>
                {subTitle}
              </Text>
            )}
          </>
        }
        content={
          <>
            {!!menuItems.length && (
              <Container className={css.optionsMenu}>
                <RbacOptionsMenuButton items={menuItems} />
              </Container>
            )}
            {!!Object.keys(metaData).length && (
              <dl className={css.metaData}>
                {Object.entries(metaData).map(([key, val]) => (
                  <div className={css.metaDataPair} key={key}>
                    <dt>{getString(key as StringKeys)}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        }
      />
      {toolbar && <Page.SubHeader className={css.toolbar}>{toolbar}</Page.SubHeader>}
      <div data-name="page-body" className={css.content}>
        {children}
      </div>
      {footer && <footer className={css.footer}>{footer}</footer>}
    </main>
  )
}
