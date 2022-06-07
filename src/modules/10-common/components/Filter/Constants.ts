/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { FormikProps } from 'formik'
import type { FilterDTO } from 'services/cd-ng'

export interface FilterInterface {
  name: string
  filterVisibility?: FilterDTO['filterVisibility']
  identifier: string
  filterProperties?: any
  orgIdentifier?: string | undefined
  projectIdentifier?: string | undefined
}

export interface FilterDataInterface<T, U> {
  formValues: FormikProps<T>['initialValues']
  metadata: U
}
