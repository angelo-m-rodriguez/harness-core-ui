/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { PermissionsContext } from 'framework/rbac/PermissionsContext'
import { LicenseStoreContext } from 'framework/LicenseStore/LicenseStoreContext'
import { AppStoreContext } from 'framework/AppStore/AppStoreContext'
import { PageSpinner } from '@common/components'
import RbacButton from '@rbac/components/Button/Button'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import MonacoEditor from '@common/components/MonacoEditor/MonacoEditor'
import MonacoDiffEditor from '@common/components/MonacoDiffEditor/MonacoDiffEditor'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { global401HandlerUtils } from '@common/utils/global401HandlerUtils'
import ChildAppError from './ChildAppError'
import type { ChildAppProps, Scope } from './index'

const logger = loggerFor(ModuleName.FRAMEWORK)

export { ChildAppProps }

export interface BaseChildAppMounterProps {
  ChildApp: React.LazyExoticComponent<React.ComponentType<ChildAppProps>>
  children?: React.ReactNode
}

export type ChildAppMounterProps<T = never> = T extends never ? BaseChildAppMounterProps : T & BaseChildAppMounterProps

export interface ChildAppMounterState {
  hasError: boolean
}

export class ChildAppMounter<T = never> extends React.Component<
  ChildAppMounterProps<T> & RouteComponentProps<Scope>,
  ChildAppMounterState
> {
  state: ChildAppMounterState = {
    hasError: false
  }

  static getDerivedStateFromError(e: Error): ChildAppMounterState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.error(e.message, e as any)
    return { hasError: true }
  }

  render(): React.ReactElement {
    const { ChildApp, match, children, history, ...rest } = this.props

    // We use routeMatch instead of location because,
    // we want to pass the mount url and not the actual url
    const { url, params, path } = match

    if (this.state.hasError) {
      return <ChildAppError />
    }

    return (
      <React.Suspense fallback={<PageSpinner />}>
        <ChildApp
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(rest as any)}
          renderUrl={url}
          matchPath={path}
          scope={params}
          parentContextObj={{
            appStoreContext: AppStoreContext,
            permissionsContext: PermissionsContext,
            licenseStoreProvider: LicenseStoreContext
          }}
          on401={() => {
            global401HandlerUtils(history)
          }}
          components={{
            RbacButton,
            RbacMenuItem,
            NGBreadcrumbs,
            MonacoEditor,
            YAMLBuilder,
            MonacoDiffEditor
          }}
          hooks={{
            useDocumentTitle
          }}
        >
          {children}
        </ChildApp>
      </React.Suspense>
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChildAppMounterWithRouter = withRouter(ChildAppMounter as any)

// It's impossible to use a HOC with Generics, while using `withRouter`
// hence, we need to create a wrapper around it to add support for generics
function ChildAppMounterWithRouterWrapper<T = never>(props: ChildAppMounterProps<T>): React.ReactElement {
  return <ChildAppMounterWithRouter {...props} />
}

export default ChildAppMounterWithRouterWrapper
