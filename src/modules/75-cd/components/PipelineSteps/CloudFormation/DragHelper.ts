/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type React from 'react'
import type { FieldArrayRenderProps } from 'formik'
import css from './DragHelper.module.scss'
/* istanbul ignore next */
export const onDragStart = (event: React.DragEvent<HTMLDivElement>, index: number): void => {
  event.dataTransfer.setData('data', index.toString())
  event.currentTarget.classList.add(css.dragging)
}
/* istanbul ignore next */
export const onDragEnd = (event: React.DragEvent<HTMLDivElement>): void => {
  event.currentTarget.classList.remove(css.dragging)
}
/* istanbul ignore next */
export const onDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
  event.currentTarget.classList.remove(css.dragOver)
}
/* istanbul ignore next */
export const onDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
  if (event.preventDefault) {
    event.preventDefault()
  }
  event.currentTarget.classList.add(css.dragOver)
  event.dataTransfer.dropEffect = 'move'
}
/* istanbul ignore next */
export const onDrop = (
  event: React.DragEvent<HTMLDivElement>,
  arrayHelpers: FieldArrayRenderProps,
  droppedIndex: number
): void => {
  if (event.preventDefault) {
    event.preventDefault()
  }
  const data = event.dataTransfer.getData('data')
  if (data) {
    const index = parseInt(data, 10)
    arrayHelpers.swap(index, droppedIndex)
  }
  event.currentTarget.classList.remove(css.dragOver)
}
