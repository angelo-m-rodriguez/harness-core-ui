/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as React from 'react'
import cx from 'classnames'
import { Icon, Layout, Text, Button, ButtonVariation } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { defaultTo, get } from 'lodash-es'
import { Event, DiagramDrag, DiagramType } from '@pipeline/components/Diagram'
import { STATIC_SERVICE_GROUP_NAME } from '@pipeline/utils/executionUtils'
import { useStrings } from 'framework/strings'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import { useQueryParams } from '@common/hooks'
import type { ExecutionPageQueryParams } from '@pipeline/utils/types'
import { BaseReactComponentProps, NodeType, PipelineGraphState, PipelineGraphType } from '../../types'
// import SVGMarker from '../SVGMarker'
import { getPositionOfAddIcon } from '../utils'
import { getPipelineGraphData } from '../../PipelineGraph/PipelineGraphUtils'
import css from './MatrixNode.module.scss'
import defaultCss from '../DefaultNode/DefaultNode.module.scss'

interface LayoutStyles {
  height: string
  width: string
  marginLeft?: string
}
const COLLAPSED_MATRIX_NODE_LENGTH = 8
const MAX_ALLOWED_MATRIX__COLLAPSED_NODES = 4
const getCalculatedStyles = (data: PipelineGraphState[], parallelism: number, showAllNodes?: boolean): LayoutStyles => {
  if (showAllNodes) {
    const maxChildLength = defaultTo(data.length, 0)
    const finalHeight =
      (Math.floor(maxChildLength / parallelism) + Math.ceil((maxChildLength % parallelism) / parallelism)) * 100
    const finalWidth = 170 * parallelism
    return { height: `${finalHeight + 240}px`, width: `${finalWidth - 40}px` } // 80 is link gap that we dont need for last stepgroup node
  } else {
    const updatedParallelism = Math.min(parallelism, MAX_ALLOWED_MATRIX__COLLAPSED_NODES)
    const maxChildLength = !showAllNodes
      ? Math.min(data.length, COLLAPSED_MATRIX_NODE_LENGTH)
      : defaultTo(data.length, 0)
    const finalHeight =
      (Math.floor(maxChildLength / updatedParallelism) +
        Math.ceil((maxChildLength % updatedParallelism) / updatedParallelism)) *
      100
    const finalWidth = 170 * updatedParallelism
    return { height: `${finalHeight + 240}px`, width: `${finalWidth - 40}px` } // 80 is
  }
}

export function MatrixNode(props: any): JSX.Element {
  const allowAdd = defaultTo(props.allowAdd, false)
  const { getString } = useStrings()
  const [showAdd, setVisibilityOfAdd] = React.useState(false)
  const [showAddLink, setShowAddLink] = React.useState(false)
  const [treeRectangle, setTreeRectangle] = React.useState<DOMRect | void>()
  const [state, setState] = React.useState<PipelineGraphState[]>([])
  const [isNodeCollapsed, setNodeCollapsed] = React.useState(false)
  const [showAllNodes, setShowAllNodes] = React.useState(false)
  const [layoutStyles, setLayoutStyles] = React.useState<LayoutStyles>({ height: '100px', width: '70px' })
  const CreateNode: React.FC<any> | undefined = props?.getNode?.(NodeType.CreateNode)?.component
  const DefaultNode: React.FC<any> | undefined = props?.getDefaultNode()?.component
  const stepGroupData = defaultTo(props?.data?.children, props?.data?.step?.data?.stepGroup) || props?.data?.step
  const stepsData = stepGroupData?.steps
  const hasStepGroupChild = stepsData?.some((step: { step: { type: string } }) => {
    const stepType = get(step, 'step.type')
    return stepType === 'STEP_GROUP'
  })
  const queryParams = useQueryParams<ExecutionPageQueryParams>()
  const defaultNode = props.getDefaultNode()?.component

  const isNestedStepGroup = Boolean(get(props, 'data.step.data.isNestedGroup'))
  const updateTreeRect = (): void => {
    const treeContainer = document.getElementById('tree-container')
    const rectBoundary = treeContainer?.getBoundingClientRect()
    setTreeRectangle(rectBoundary)
  }
  const { errorMap } = useValidationErrors()
  const {
    state: { templateTypes },
    getStagePathFromPipeline
  } = usePipelineContext()

  const stagePath = getStagePathFromPipeline(props?.identifier || '', 'pipeline.stages')

  React.useEffect(() => {
    props?.updateGraphLinks?.()
  }, [isNodeCollapsed])

  React.useLayoutEffect(() => {
    if (state?.length) {
      props?.updateGraphLinks?.()
    }
  }, [layoutStyles])

  React.useEffect(() => {
    updateTreeRect()
  }, [])

  React.useLayoutEffect(() => {
    if (props?.data?.children?.length) {
      setState(
        getPipelineGraphData({
          data: props.data?.children,
          templateTypes: templateTypes,
          serviceDependencies: undefined,
          errorMap: errorMap,
          graphDataType: PipelineGraphType.STAGE_GRAPH,
          parentPath: `${stagePath}.stage.spec.execution.steps.stepGroup.steps` //index after step missing - getStepPathFromPipeline??
        })
      )
    }
  }, [treeRectangle, props.data, templateTypes])

  React.useLayoutEffect(() => {
    if (state?.length) {
      setLayoutStyles(getCalculatedStyles(state, props?.data?.maxParallelism, showAllNodes))
    }
  }, [state, props?.isNodeCollapsed, showAllNodes])

  const isSelectedNode = React.useMemo(() => {
    return state.some(node => node.id === queryParams?.stageId)
  }, [queryParams?.stageId, isNodeCollapsed])

  return (
    <>
      {isNodeCollapsed && DefaultNode ? (
        <DefaultNode
          onClick={() => {
            setNodeCollapsed(false)
          }}
          {...props}
          isSelected={isSelectedNode}
          icon="step-group"
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <Layout.Horizontal className={css.matrixLabel}>
            <Icon size={16} name="looping" style={{ marginRight: '5px' }} color={Color.WHITE} />
            <Text color={Color.WHITE} font="small" style={{ paddingRight: '5px' }}>
              MATRIX
            </Text>
          </Layout.Horizontal>
          <div
            onMouseOver={e => {
              e.stopPropagation()
              allowAdd && setVisibilityOfAdd(true)
            }}
            onMouseLeave={e => {
              e.stopPropagation()
              allowAdd && setVisibilityOfAdd(false)
            }}
            onDragLeave={() => allowAdd && setVisibilityOfAdd(false)}
            style={stepGroupData?.containerCss ? stepGroupData?.containerCss : undefined}
            className={cx(
              css.stepGroup,
              { [css.firstnode]: !props?.isParallelNode },
              { [css.marginBottom]: props?.isParallelNode },
              { [css.nestedGroup]: isNestedStepGroup },
              { [css.stepGroupParent]: hasStepGroupChild },
              { [css.stepGroupNormal]: !isNestedStepGroup && !hasStepGroupChild }
            )}
          >
            <div id={props?.id} className={css.horizontalBar}></div>
            {props.data?.skipCondition && (
              <div className={css.conditional}>
                <Text
                  tooltip={`Skip condition:\n${props.data?.skipCondition}`}
                  tooltipProps={{
                    isDark: true
                  }}
                >
                  <Icon size={26} name={'conditional-skip-new'} color="white" />
                </Text>
              </div>
            )}
            {props.data?.conditionalExecutionEnabled && (
              <div className={css.conditional}>
                <Text
                  tooltip={getString('pipeline.conditionalExecution.title')}
                  tooltipProps={{
                    isDark: true
                  }}
                >
                  <Icon size={26} name={'conditional-skip-new'} color="white" />
                </Text>
              </div>
            )}
            <div className={css.stepGroupHeader}>
              <Layout.Horizontal
                spacing="xsmall"
                onMouseOver={e => {
                  e.stopPropagation()
                }}
                onMouseOut={e => {
                  e.stopPropagation()
                }}
              >
                <Icon
                  className={css.collapseIcon}
                  name="minus"
                  onClick={e => {
                    e.stopPropagation()
                    setNodeCollapsed(true)
                  }}
                />
                <Text
                  data-nodeid={props.id}
                  className={css.cursor}
                  onMouseEnter={event => {
                    event.stopPropagation()
                    props?.fireEvent?.({
                      type: Event.MouseEnterNode,
                      target: event.target,
                      data: { ...props }
                    })
                  }}
                  onMouseLeave={event => {
                    event.stopPropagation()
                    setVisibilityOfAdd(false)
                    props?.fireEvent?.({
                      type: Event.MouseLeaveNode,
                      target: event.target,
                      data: { ...props }
                    })
                  }}
                  lineClamp={1}
                  onClick={event => {
                    event.stopPropagation()
                    setVisibilityOfAdd(false)
                    props?.fireEvent?.({
                      type: Event.StepGroupClicked,
                      target: event.target,
                      data: { ...props }
                    })
                  }}
                >
                  {props.name}
                </Text>
              </Layout.Horizontal>
            </div>
            <div className={css.stepGroupBody} style={layoutStyles}>
              <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '80px', rowGap: '20px' }}>
                {state.slice(0, showAllNodes ? state.length : COLLAPSED_MATRIX_NODE_LENGTH).map((node: any) => {
                  const NodeComponent: React.FC<BaseReactComponentProps> = defaultTo(
                    props.getNode?.(node?.type)?.component,
                    defaultNode
                  ) as React.FC<BaseReactComponentProps>
                  return (
                    <NodeComponent
                      {...node}
                      parentIdentifier={node.parentIdentifier}
                      key={node.data?.identifier}
                      getNode={props.getNode}
                      fireEvent={props.fireEvent}
                      getDefaultNode={props.getDxefaultNode}
                      className={cx(css.graphNode, node.className)}
                      isSelected={node.selectedNode === node.data?.identifier}
                      isParallelNode={node.isParallelNode}
                      allowAdd={
                        (!node.data?.children?.length && !node.isParallelNode) ||
                        (node.isParallelNode && node.isLastChild)
                      }
                      isFirstParallelNode={true}
                      prevNodeIdentifier={node.prevNodeIdentifier}
                      prevNode={node.prevNode}
                      nextNode={node.nextNode}
                      updateGraphLinks={node.updateGraphLinks}
                      readonly={props.readonly}
                      selectedNodeId={queryParams?.stageId}
                      showMarkers={false}
                      name={`${node?.matrixNodeName}${node?.name}`}
                    />
                  )
                })}
              </div>
            </div>
            {!props.readonly && props?.identifier !== STATIC_SERVICE_GROUP_NAME && (
              <Button
                className={cx(css.closeNode, { [css.readonly]: props.readonly })}
                minimal
                icon="cross"
                variation={ButtonVariation.PRIMARY}
                iconProps={{ size: 10 }}
                onMouseDown={e => {
                  e.stopPropagation()
                  props?.fireEvent?.({
                    type: Event.RemoveNode,
                    data: {
                      identifier: props?.identifier,
                      node: props
                    }
                  })
                }}
                withoutCurrentColor={true}
              />
            )}
            <Layout.Horizontal className={css.matrixFooter}>
              <Layout.Horizontal margin={0} className={css.showNodes}>
                <Text padding={0}>{`${!showAllNodes ? COLLAPSED_MATRIX_NODE_LENGTH : state.length}/ ${
                  state.length
                }`}</Text>
                <Text className={css.showNodeText} padding={0} onClick={() => setShowAllNodes(!showAllNodes)}>
                  {`${!showAllNodes ? 'Show All' : 'Hide All'}`}
                </Text>
              </Layout.Horizontal>
              <Text font="normal" margin={0}>
                {getString('pipeline.MatrixNode.maxParallelism')} {props?.data?.maxParallelism}
              </Text>
            </Layout.Horizontal>
          </div>
          {!props.isParallelNode && !props.readonly && (
            <div
              style={{ left: getPositionOfAddIcon(props) }}
              data-linkid={props?.identifier}
              onMouseOver={event => event.stopPropagation()}
              onClick={event => {
                event.stopPropagation()
                props?.fireEvent?.({
                  type: Event.AddLinkClicked,
                  target: event.target,
                  data: {
                    entityType: DiagramType.Link,
                    node: props,
                    prevNodeIdentifier: props?.prevNodeIdentifier,
                    parentIdentifier: props?.parentIdentifier,
                    identifier: props?.identifier
                  }
                })
              }}
              onDragOver={event => {
                event.stopPropagation()
                event.preventDefault()
                setShowAddLink(true)
              }}
              onDragLeave={event => {
                event.stopPropagation()
                event.preventDefault()
                setShowAddLink(false)
              }}
              onDrop={event => {
                event.stopPropagation()
                setShowAddLink(false)
                props?.fireEvent?.({
                  type: Event.DropLinkEvent,
                  target: event.target,
                  data: {
                    linkBeforeStepGroup: false,
                    entityType: DiagramType.Link,
                    node: JSON.parse(event.dataTransfer.getData(DiagramDrag.NodeDrag)),
                    destination: props
                  }
                })
              }}
              className={cx(defaultCss.addNodeIcon, defaultCss.stepAddIcon, defaultCss.stepGroupAddIcon, {
                [defaultCss.show]: showAddLink
              })}
            >
              <Icon name="plus" color={Color.WHITE} />
            </div>
          )}
          {allowAdd && !props.readonly && CreateNode && (
            <CreateNode
              className={cx(
                defaultCss.addNode,
                { [defaultCss.visible]: showAdd },
                { [defaultCss.marginBottom]: props?.isParallelNode }
              )}
              onMouseOver={() => allowAdd && setVisibilityOfAdd(true)}
              onMouseLeave={() => allowAdd && setVisibilityOfAdd(false)}
              onDrop={(event: any) => {
                props?.fireEvent?.({
                  type: Event.DropNodeEvent,
                  data: {
                    entityType: DiagramType.Default,
                    node: JSON.parse(event.dataTransfer.getData(DiagramDrag.NodeDrag)),
                    destination: props
                  }
                })
              }}
              onClick={(event: any): void => {
                event.stopPropagation()
                props?.fireEvent?.({
                  type: Event.AddParallelNode,
                  target: event.target,
                  data: {
                    identifier: props?.identifier,
                    parentIdentifier: props?.parentIdentifier,
                    entityType: DiagramType.MatrixNode,
                    node: props
                  }
                })
              }}
              name={''}
              hidden={!showAdd}
            />
          )}
        </div>
      )}
    </>
  )
}
