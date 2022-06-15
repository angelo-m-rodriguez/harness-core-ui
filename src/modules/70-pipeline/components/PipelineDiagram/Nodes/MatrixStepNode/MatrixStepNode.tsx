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
import { BaseReactComponentProps, NodeType, PipelineGraphState } from '../../types'
import { getPositionOfAddIcon } from '../utils'
import css from './MatrixStepNode.module.scss'
import defaultCss from '../DefaultNode/DefaultNode.module.scss'

interface LayoutStyles {
  height: string
  width: string
  marginLeft?: string
}

const COLLAPSED_MATRIX_NODE_LENGTH = 8
const MAX_ALLOWED_MATRIX__COLLAPSED_NODES = 4
const DEFAULT_MATRIX_PARALLELISM = 1

const getCalculatedStyles = (data: PipelineGraphState[], parallelism = 1, showAllNodes?: boolean): LayoutStyles => {
  const nodeWidth = 170 //data?.[0]?.nodeType === 'Approval' ? 170 : 200
  const nodeHeight = 130 //data?.[0]?.nodeType === 'Approval' ? 130 : 100
  parallelism = parallelism || DEFAULT_MATRIX_PARALLELISM

  if (showAllNodes) {
    const maxChildLength = defaultTo(data.length, 0)
    const finalHeight =
      (Math.floor(maxChildLength / parallelism) + Math.ceil((maxChildLength % parallelism) / parallelism)) * nodeHeight
    const finalWidth = nodeWidth * parallelism
    return { height: `${finalHeight + 100}px`, width: `${finalWidth - 40}px` } // 80 is link gap that we dont need for last stepgroup node
  } else {
    const updatedParallelism = Math.min(parallelism, MAX_ALLOWED_MATRIX__COLLAPSED_NODES)
    const maxChildLength = Math.min(data.length, COLLAPSED_MATRIX_NODE_LENGTH)
    const finalHeight =
      (Math.floor(maxChildLength / updatedParallelism) +
        Math.ceil((maxChildLength % updatedParallelism) / updatedParallelism)) *
      nodeHeight
    const finalWidth = nodeWidth * updatedParallelism
    return { height: `${finalHeight + 100}px`, width: `${finalWidth - 40}px` } // 80 is
  }
}

export function MatrixStepNode(props: any): JSX.Element {
  const allowAdd = defaultTo(props.allowAdd, false)
  const { getString } = useStrings()
  const [showAdd, setVisibilityOfAdd] = React.useState(false)
  const [showAddLink, setShowAddLink] = React.useState(false)
  const [isNodeCollapsed, setNodeCollapsed] = React.useState(false)
  const [showAllNodes, setShowAllNodes] = React.useState(false)
  const [layoutStyles, setLayoutStyles] = React.useState<LayoutStyles>({ height: '100px', width: '70px' })
  const CreateNode: React.FC<any> | undefined = props?.getNode?.(NodeType.CreateNode)?.component
  const DefaultNode: React.FC<any> | undefined = props?.getDefaultNode()?.component
  const stepGroupData = defaultTo(props?.data?.matrixGroup, props?.data?.step?.data?.stepGroup) || props?.data?.step
  const stepsData = stepGroupData?.steps
  const hasStepGroupChild = stepsData?.some((step: { step: { type: string } }) => {
    const stepType = get(step, 'step.type')
    return stepType === 'STEP_GROUP'
  })
  const isNestedStepGroup = Boolean(get(props, 'data.step.data.isNestedGroup'))

  React.useEffect(() => {
    props?.updateGraphLinks?.()
  }, [isNodeCollapsed])

  React.useLayoutEffect(() => {
    if (props?.data?.length) {
      props?.updateGraphLinks?.()
    }
  }, [layoutStyles])

  React.useLayoutEffect(() => {
    if (props?.data?.matrixGroup?.steps?.length) {
      setLayoutStyles(getCalculatedStyles(props?.data?.matrixGroup?.steps, props?.data?.maxParallelism, showAllNodes))
    }
  }, [props?.data?.matrixGroup?.steps, isNodeCollapsed, props?.isNodeCollapsed, showAllNodes])

  return (
    <>
      {isNodeCollapsed && DefaultNode ? (
        <DefaultNode
          onClick={() => {
            setNodeCollapsed(false)
          }}
          {...props}
          icon="step-group"
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <Layout.Horizontal className={css.matrixLabel}>
            <Icon size={16} name="looping" style={{ marginRight: '5px' }} color={Color.WHITE} />
            <Text color={Color.WHITE} font="small" style={{ paddingRight: '5px' }}>
              {props?.data?.nodeType}
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
                {props?.data?.matrixGroup?.steps
                  ?.slice(0, showAllNodes ? props?.data?.matrixGroup?.steps?.length : COLLAPSED_MATRIX_NODE_LENGTH)
                  .map(({ step: node }: any) => {
                    const defaultNode = props?.getDefaultNode()?.component
                    const NodeComponent: React.FC<BaseReactComponentProps> = defaultTo(
                      props.getNode?.(node?.type)?.component,
                      defaultNode
                    ) as React.FC<BaseReactComponentProps>
                    return (
                      <NodeComponent
                        {...node}
                        id={node?.uuid}
                        nodeType={node?.type}
                        parentIdentifier={node.parentIdentifier}
                        key={node.data?.identifier}
                        getNode={props.getNode}
                        fireEvent={props.fireEvent}
                        getDefaultNode={props.getDxefaultNode}
                        className={cx(css.graphNode, node.className)}
                        isSelected={node.selectedNode === (node.data?.id || node.data?.uuid)}
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
                        selectedNodeId={
                          props?.selectedNodeId
                          // || queryParams?.stageId
                        }
                        showMarkers={false}
                        name={node?.matrixNodeName ? `${node?.matrixNodeName}${node?.name}` : node?.name}
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
                <Text padding={0}>{`${
                  !showAllNodes
                    ? Math.min(props?.data?.matrixGroup?.steps.length, COLLAPSED_MATRIX_NODE_LENGTH)
                    : props?.data?.matrixGroup?.steps.length
                }/ ${props?.data?.matrixGroup?.steps.length}`}</Text>
                {props?.data?.matrixGroup?.steps.length > COLLAPSED_MATRIX_NODE_LENGTH && (
                  <Text className={css.showNodeText} padding={0} onClick={() => setShowAllNodes(!showAllNodes)}>
                    {`${!showAllNodes ? 'Show All' : 'Hide All'}`}
                  </Text>
                )}
              </Layout.Horizontal>
              <Text font="normal" margin={0}>
                {getString('pipeline.MatrixNode.maxParallelism')} {props?.data?.maxParallelism || 1}
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
                    entityType: DiagramType.StepGroupNode,
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
