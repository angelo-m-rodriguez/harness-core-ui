/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { lazy } from 'react'

// eslint-disable-next-line import/no-unresolved
export const RemoteSTOApp = lazy(() => import('sto/App'))
// eslint-disable-next-line import/no-unresolved
export const RemotePipelineSecurityView = lazy(() => import('sto/PipelineSecurityView'))
