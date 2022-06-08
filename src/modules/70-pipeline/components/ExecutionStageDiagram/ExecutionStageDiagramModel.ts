/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { LinkModelListener, NodeModelListener } from '@projectstorm/react-diagrams-core'
import type { BaseModelListener } from '@projectstorm/react-canvas-core'
import cx from 'classnames'
import { last, isEmpty, get } from 'lodash-es'
import { ExecutionStatusEnum, isExecutionRunning } from '@pipeline/utils/statusHelpers'
import { cloudFormationSteps } from '@pipeline/utils/executionUtils'
import { ExecutionPipeline, ExecutionPipelineNode, ExecutionPipelineNodeType } from './ExecutionPipelineModel'
import {
  getNodeStyles,
  getStatusProps,
  getArrowsColor,
  GroupState,
  getIconStyleBasedOnStatus,
  getTertiaryIconProps,
  getConditionalExecutionFlag,
  calculateGroupHeaderDepth,
  calculateDepth,
  containGroup,
  getParallelNodesStatusForInLine,
  getParallelNodesStatusForOutLines
} from './ExecutionStageDiagramUtils'
import { STATIC_SERVICE_GROUP_NAME } from '../PipelineStudio/ExecutionGraph/ExecutionGraphUtil'
import * as Diagram from '../Diagram'
import css from './ExecutionStageDiagram.module.scss'

const SPACE_AFTER_GROUP = 0.2
const GROUP_HEADER_DEPTH = 0.3

export interface NodeStyleInterface {
  width: number
  height: number
}

export interface GridStyleInterface {
  gridSize?: number
  startX?: number
  startY?: number
  gapX?: number
}

export interface Listeners {
  nodeListeners: NodeModelListener
  linkListeners: LinkModelListener
  layerListeners: BaseModelListener
}

export const EmptyNodeSeparator = '$node$'

export interface ExecutionStageDiagramConfiguration {
  FIRST_AND_LAST_SEGMENT_LENGTH: number
  SPACE_BETWEEN_ELEMENTS: number
  FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH: number
  LINE_SEGMENT_LENGTH: number
  PARALLEL_LINES_WIDTH: number
  LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP: number
  NODE_WIDTH: number
  START_AND_END_NODE_WIDTH: number
  ALLOW_PORT_HIDE: boolean
  NODE_HAS_BORDER: boolean
}

interface RenderGraphNodesProps<T> {
  node: ExecutionPipelineNode<T>
  startX: number
  startY: number
  selectedStageId?: string
  disableCollapseButton?: boolean
  diagramContainerHeight?: number
  prevNodes?: Diagram.DefaultNodeModel[]
  showEndNode?: boolean
  groupStage?: Map<string, GroupState<T>> // = new Map(),
  verticalStepGroup?: boolean // = false,
  isRootGroup?: boolean // = true
  isFirstNode?: boolean
  isFirstStepGroupNode?: boolean
  isParallelNode?: boolean
}
export class ExecutionStageDiagramModel extends Diagram.DiagramModel {
  nodeStyle: NodeStyleInterface = { width: 200, height: 200 }
  protected diagConfig: ExecutionStageDiagramConfiguration

  constructor() {
    super({
      gridSize: 100,
      startX: 70,
      startY: 50,
      gapX: 200,
      gapY: 140
    })

    this.diagConfig = {
      FIRST_AND_LAST_SEGMENT_LENGTH: 48,
      SPACE_BETWEEN_ELEMENTS: 72,
      FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH: 48,
      LINE_SEGMENT_LENGTH: 30,
      PARALLEL_LINES_WIDTH: 60, // NOTE: PARALLEL_LINES_WIDTH >= 2 * LINE_SEGMENT_LENGTH
      LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP: 56, // 56
      NODE_WIDTH: 64,
      START_AND_END_NODE_WIDTH: 30,
      ALLOW_PORT_HIDE: true,
      NODE_HAS_BORDER: true
    }
  }

  setGridStyle(style: GridStyleInterface): void {
    Object.assign(this, style)
  }

  setDefaultNodeStyle(style: NodeStyleInterface): void {
    this.nodeStyle = style
  }

  setGraphConfiguration(diagConfig: Partial<ExecutionStageDiagramConfiguration>): void {
    Object.assign(this.diagConfig, diagConfig)
  }

  renderGraphNodes<T>(props: RenderGraphNodesProps<T>): {
    startX: number
    startY: number
    prevNodes?: Diagram.DefaultNodeModel[]
  } {
    const {
      node,
      selectedStageId,
      disableCollapseButton,
      diagramContainerHeight,
      showEndNode,
      groupStage = new Map(),
      verticalStepGroup = false,
      isRootGroup = true,
      isFirstNode = false,
      isFirstStepGroupNode = false,
      isParallelNode = false
    } = props
    const {
      FIRST_AND_LAST_SEGMENT_LENGTH,
      SPACE_BETWEEN_ELEMENTS,
      FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH,
      LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP,
      LINE_SEGMENT_LENGTH,
      PARALLEL_LINES_WIDTH,
      NODE_WIDTH,
      ALLOW_PORT_HIDE,
      NODE_HAS_BORDER
    } = this.diagConfig
    let { startX, startY, prevNodes } = props
    const { nodeStyle } = this
    if (!node) {
      return { startX, startY, prevNodes: [] }
    }
    if (node.item && !node.parallel) {
      const { item: stage } = node
      const { type } = stage

      startX += verticalStepGroup
        ? LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP
        : isFirstNode
        ? FIRST_AND_LAST_SEGMENT_LENGTH
        : isFirstStepGroupNode
        ? FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
        : isParallelNode
        ? PARALLEL_LINES_WIDTH
        : SPACE_BETWEEN_ELEMENTS

      const isSelected = selectedStageId === stage.identifier
      const statusProps = getStatusProps(stage.status, type)
      const tertiaryIconProps = getTertiaryIconProps(stage)
      let nodeRender = this.getNodeFromId(stage.identifier)
      const stepType = get(stage, 'data.stepType', '')
      const commonOption: Diagram.DiamondNodeModelOptions = {
        customNodeStyle: getNodeStyles(isSelected, stage.status, type, NODE_HAS_BORDER),
        canDelete: false,
        ...statusProps,
        ...tertiaryIconProps,
        nodeClassName: cx(
          { [css.runningNode]: isExecutionRunning(stage.status) },
          { [css.selected]: isExecutionRunning(stage.status) && isSelected }
        ),
        iconStyle: getIconStyleBasedOnStatus(stage.status, isSelected, stage.data),
        icon: stage.icon,
        skipCondition: stage?.skipCondition,
        defaultSelected: isSelected,
        conditionalExecutionEnabled: getConditionalExecutionFlag(stage.when),
        disableClick: stage.disableClick,
        iconSize: cloudFormationSteps.includes(stepType) ? 32 : 20
      }
      if (!nodeRender) {
        nodeRender =
          type === ExecutionPipelineNodeType.ICON
            ? /* istanbul ignore next */ new Diagram.IconNodeModel({
                identifier: stage.identifier,
                id: stage.identifier,
                ...commonOption,
                customNodeStyle: {
                  ...commonOption.customNodeStyle,
                  border: 'none'
                },
                width: nodeStyle.width,
                height: nodeStyle.height,
                name: stage.name,
                icon: stage.icon,
                iconSize: stage.iconSize,
                iconStyle: {
                  marginBottom: '30px'
                }
              })
            : type === ExecutionPipelineNodeType.DIAMOND
            ? /* istanbul ignore next */ new Diagram.DiamondNodeModel({
                identifier: stage.identifier,
                id: stage.identifier,
                ...commonOption,
                width: 57,
                height: 57,
                customNodeStyle: {
                  ...commonOption.customNodeStyle
                },
                name: stage.name
              })
            : new Diagram.DefaultNodeModel({
                identifier: stage.identifier,
                id: stage.identifier,
                name: stage.name,
                ...commonOption,
                width: nodeStyle.width,
                height: nodeStyle.height,
                showPorts: !verticalStepGroup
              })

        this.addNode(nodeRender)
      } else {
        nodeRender.setOptions({
          ...nodeRender.getOptions(),
          ...commonOption,
          iconStyle: {
            ...commonOption.iconStyle,
            ...stage?.iconStyle
          }
        })
      }
      nodeRender.setPosition(startX, startY)
      startX +=
        type === ExecutionPipelineNodeType.DIAMOND || type === ExecutionPipelineNodeType.ICON
          ? NODE_WIDTH + 30
          : NODE_WIDTH

      /* istanbul ignore else */ if (!isEmpty(prevNodes) && prevNodes) {
        prevNodes.forEach((prevNode: Diagram.DefaultNodeModel) => {
          this.connectedParentToNode(
            nodeRender as Diagram.DefaultNodeModel<Diagram.DefaultNodeModelGenerics>,
            prevNode,
            false,
            0,
            getArrowsColor(stage.status, undefined, verticalStepGroup),
            { type: 'in', size: LINE_SEGMENT_LENGTH }
          )
        })
      }
      return { startX, startY, prevNodes: [nodeRender] }
    } else if (node.parallel && prevNodes) {
      const { parallel } = node
      /* istanbul ignore else */ if (parallel.length > 0) {
        // lines calculation
        const inLineStatus = getParallelNodesStatusForInLine(parallel)
        const outLinesStatus = getParallelNodesStatusForOutLines(parallel)

        let newX = startX
        let newY = startY
        /* istanbul ignore else */ if (!isEmpty(prevNodes)) {
          const emptyNodeStart =
            this.getNodeFromId(
              `${EmptyNodeSeparator}-${EmptyNodeSeparator}${
                parallel[0].item?.identifier || parallel[0].group?.identifier
              }-Start`
            ) ||
            new Diagram.EmptyNodeModel({
              id: `${EmptyNodeSeparator}-${EmptyNodeSeparator}${
                parallel[0].item?.identifier || parallel[0].group?.identifier
              }-Start`,
              name: 'Empty',
              showPorts: !verticalStepGroup,
              hideOutPort: true
            })
          this.addNode(emptyNodeStart)

          newX += verticalStepGroup
            ? 0
            : isFirstNode
            ? FIRST_AND_LAST_SEGMENT_LENGTH
            : isFirstStepGroupNode
            ? FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
            : SPACE_BETWEEN_ELEMENTS

          emptyNodeStart.setPosition(newX, newY)
          prevNodes.forEach((prevNode: Diagram.DefaultNodeModel) => {
            this.connectedParentToNode(
              emptyNodeStart,
              prevNode,
              false,
              0,
              getArrowsColor(inLineStatus, undefined, verticalStepGroup)
            )
          })
          prevNodes = [emptyNodeStart]
        }
        const prevNodesAr: Diagram.DefaultNodeModel[] = []
        parallel.forEach((nodeP, pIdx) => {
          const resp = this.renderGraphNodes({
            node: nodeP,
            startX: newX,
            startY: newY,
            selectedStageId: selectedStageId,
            disableCollapseButton: disableCollapseButton,
            diagramContainerHeight: diagramContainerHeight,
            prevNodes: prevNodes,
            showEndNode: showEndNode,
            groupStage: groupStage,
            verticalStepGroup: verticalStepGroup,
            isRootGroup: isRootGroup && pIdx == 0,
            isParallelNode: true
          })

          startX = Math.max(startX, resp.startX)

          const depthYParallel = calculateDepth(nodeP, groupStage, SPACE_AFTER_GROUP, SPACE_AFTER_GROUP)
          newY = resp.startY + this.gapY * depthYParallel
          /* istanbul ignore else */ if (resp.prevNodes) {
            prevNodesAr.push(...resp.prevNodes)
          }
        })
        /* istanbul ignore else */ if (!isEmpty(prevNodesAr)) {
          const emptyNodeId = `${EmptyNodeSeparator}${
            parallel[0].item?.identifier || parallel[0].group?.identifier
          }${EmptyNodeSeparator}-End`
          const emptyNodeEnd =
            this.getNodeFromId(emptyNodeId) ||
            new Diagram.EmptyNodeModel({
              id: emptyNodeId,
              name: 'Empty',
              showPorts: !verticalStepGroup,
              hideInPort: true,
              hideOutPort: !outLinesStatus.displayLines && ALLOW_PORT_HIDE
            })
          // NOTE: this does not work
          // emptyNodeEnd.setOptions({
          //   ...emptyNodeEnd.getOptions(),
          //   ...{ showPorts: !verticalStepGroup, hideInPort: true, hideOutPort: !outLinesStatus.displayLines }
          // })

          // NOTE: workaround solution to show out port
          if (outLinesStatus.displayLines && !verticalStepGroup && ALLOW_PORT_HIDE) {
            makeVisibleOutPortOnEmptyNode(emptyNodeId)
          }

          this.addNode(emptyNodeEnd)
          startX += verticalStepGroup ? 0 : PARALLEL_LINES_WIDTH
          emptyNodeEnd.setPosition(startX, startY)
          prevNodesAr.forEach((prevNode: Diagram.DefaultNodeModel) => {
            this.connectedParentToNode(
              emptyNodeEnd,
              prevNode,
              false,
              0,
              getArrowsColor(
                outLinesStatus.status,
                true,
                verticalStepGroup || (!outLinesStatus.displayLines && !showEndNode)
              ),
              { type: 'out', size: LINE_SEGMENT_LENGTH }
            )
          })
          prevNodes = [emptyNodeEnd]
        }
      } else {
        return this.renderGraphNodes({
          node: parallel[0],
          startX,
          startY,
          selectedStageId,
          disableCollapseButton,
          diagramContainerHeight,
          prevNodes,
          showEndNode,
          groupStage,
          verticalStepGroup,
          isRootGroup
        })
      }
      return { startX, startY, prevNodes }
    } /* istanbul ignore else */ else if (node.group) {
      /* istanbul ignore else */ if (!groupStage.get(node.group.identifier)?.collapsed) {
        this.clearAllLinksForNodeAndNode(node.group.identifier)
        this.activeNodeLayer.removeModel(node.group.identifier)

        // lines calculation
        const lastItem = last(node.group?.items)
        const outLineStatus = getParallelNodesStatusForOutLines(lastItem ? [lastItem] : [])

        // depth calculation
        let depthY = calculateDepth(node, groupStage, 0, SPACE_AFTER_GROUP)
        const headerDepth = calculateGroupHeaderDepth(node.group.items, GROUP_HEADER_DEPTH)
        //NOTE: decrease depth if its a  (1)root group that (3)has group (2)group is not at first level
        if (isRootGroup && headerDepth === 0 && containGroup(node.group.items)) {
          depthY -= GROUP_HEADER_DEPTH
        }

        const stepGroupLayer =
          this.getGroupLayer(node.group.identifier) ||
          new Diagram.StepGroupNodeLayerModel({
            identifier: node.group.identifier,
            id: node.group.identifier
            //hideOutPort: !outLineStatus.displayLines
          })
        stepGroupLayer.setOptions({
          childrenDistance: this.gapY,
          depth: depthY,
          headerDepth: headerDepth + GROUP_HEADER_DEPTH,
          label: node.group.name,
          containerCss: node.group.containerCss,
          textCss: node.group.textCss,
          skipCondition: node.group.skipCondition,
          conditionalExecutionEnabled: getConditionalExecutionFlag(node.group.when),
          showRollback: false,
          disableCollapseButton: disableCollapseButton
          //hideOutPort: !outLineStatus.displayLines
        })

        /* istanbul ignore else */ if (prevNodes && prevNodes.length > 0) {
          startX += isFirstNode
            ? FIRST_AND_LAST_SEGMENT_LENGTH
            : isFirstStepGroupNode
            ? FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
            : isParallelNode
            ? PARALLEL_LINES_WIDTH
            : SPACE_BETWEEN_ELEMENTS
          stepGroupLayer.startNode.setPosition(startX, startY)
          prevNodes.forEach((prevNode: Diagram.DefaultNodeModel) => {
            this.connectedParentToNode(
              stepGroupLayer.startNode,
              prevNode,
              false,
              0,
              getArrowsColor(node.group?.status || /* istanbul ignore next */ ExecutionStatusEnum.NotStarted),
              { type: 'in', size: LINE_SEGMENT_LENGTH }
            )
          })
          prevNodes = [stepGroupLayer.startNode]
        }
        this.useStepGroupLayer(stepGroupLayer)

        // Check if step group has nodes
        /* istanbul ignore else */ if (node.group.items?.length > 0) {
          node.group.items.forEach((step, index) => {
            const resp = this.renderGraphNodes({
              node: step,
              startX,
              startY,
              selectedStageId,
              disableCollapseButton,
              diagramContainerHeight,
              prevNodes,
              showEndNode,
              groupStage,
              verticalStepGroup: node.group?.verticalStepGroup,
              isRootGroup: false,
              isFirstStepGroupNode: index === 0
            })

            startX = resp.startX
            startY = resp.startY
            /* istanbul ignore else */ if (resp.prevNodes) {
              prevNodes = resp.prevNodes
            }
          })
        }
        /* istanbul ignore else */ if (prevNodes && prevNodes.length > 0) {
          startX += node.group?.verticalStepGroup
            ? LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP
            : FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH

          stepGroupLayer.endNode.setPosition(startX, startY)

          // NOTE: this cleanup line that is connected from last node in the group with stepGroupLayer.endNode
          // this is a solution for overlapping line bug
          const port = stepGroupLayer.endNode.getPorts()['In']
          if (port) {
            this.clearLinksForPort(port)
          }

          prevNodes.forEach((prevNode: Diagram.DefaultNodeModel) => {
            this.connectedParentToNode(
              stepGroupLayer.endNode,
              prevNode,
              false,
              0,
              getArrowsColor(
                outLineStatus.status || /* istanbul ignore next */ ExecutionStatusEnum.NotStarted,
                true,
                node.group?.verticalStepGroup || (!outLineStatus.displayLines && !showEndNode)
              )
            )
          })
          prevNodes = [stepGroupLayer.endNode]
        }
        this.useNormalLayer()
        return { startX, startY, prevNodes: prevNodes }
      } else {
        this.clearAllStageGroups(node)

        startX += isFirstNode
          ? FIRST_AND_LAST_SEGMENT_LENGTH
          : isFirstStepGroupNode
          ? FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
          : isParallelNode
          ? PARALLEL_LINES_WIDTH
          : SPACE_BETWEEN_ELEMENTS

        const nodeRender =
          this.getNodeFromId(node.group.identifier) ||
          new Diagram.DefaultNodeModel({
            identifier: node.group.identifier,
            id: node.group.identifier,
            name: node.group.name,
            canDelete: false,
            icon: node.group.icon,
            secondaryIcon: 'plus',
            skipCondition: node.group.skipCondition,
            conditionalExecutionEnabled: getConditionalExecutionFlag(node.group.when),
            customNodeStyle: node.group.cssProps
          })
        this.addNode(nodeRender)
        nodeRender.setPosition(startX, startY)
        startX += NODE_WIDTH

        if (!isEmpty(prevNodes) && prevNodes) {
          prevNodes.forEach((prevNode: Diagram.DefaultNodeModel) => {
            this.connectedParentToNode(
              nodeRender,
              prevNode,
              false,
              0,
              getArrowsColor(node.group?.status || ExecutionStatusEnum.NotStarted),
              { type: 'in', size: LINE_SEGMENT_LENGTH }
            )
          })
        }
        return { startX, startY, prevNodes: [nodeRender] }
      }
    }
    return { startX, startY }
  }

  clearAllStageGroups<T>(node: ExecutionPipelineNode<T>): void {
    if (node.group && this.getGroupLayer(node.group.identifier)) {
      const layer = this.getGroupLayer(node.group.identifier)
      this.clearAllLinksForGroupLayer(node.group.identifier)
      const items = node.group.items
      if (items.length > 0) {
        items.forEach(item => {
          if (item.item) {
            this.clearAllLinksForNodeAndNode(item.item.identifier)
            layer?.removeModel(item.item.identifier)
          } else if (item.group) {
            this.clearAllStageGroups(item)
            layer?.removeModel(item.group.identifier)
          } else if (item.parallel && item.parallel.length > 0) {
            item.parallel.forEach(nodeP => {
              this.clearAllStageGroups(nodeP)
              layer?.removeModel(nodeP.group?.identifier || '')
            })

            // NOTE: clear end node for parallel
            this.clearAllLinksForNodeAndNode(
              `${EmptyNodeSeparator}${
                item.parallel[0].item?.identifier || item.parallel[0].group?.identifier
              }${EmptyNodeSeparator}-End`
            )
            layer?.removeModel(
              `${EmptyNodeSeparator}${
                item.parallel[0].item?.identifier || item.parallel[0].group?.identifier
              }${EmptyNodeSeparator}-End`
            )
          }
        })
      }
    }
  }

  addUpdateGraph<T>(
    pipeline: ExecutionPipeline<T>,
    listeners: Listeners,
    selectedId?: string,
    diagramContainerHeight?: number,
    showStartEndNode?: boolean,
    showEndNode?: boolean,
    groupStage?: Map<string, GroupState<T>>,
    hideCollapseButton?: boolean
  ): void {
    const { FIRST_AND_LAST_SEGMENT_LENGTH, START_AND_END_NODE_WIDTH } = this.diagConfig
    let { startX, startY } = this

    /* istanbul ignore if */ if (pipeline.items.length === 0) {
      return
    }

    // Unlock Graph
    this.setLocked(false)
    this.clearAllListeners()
    let prevNodes: Diagram.DefaultNodeModel[] = []

    /* istanbul ignore else */ if (showStartEndNode) {
      //Start Node
      const startNode = this.getNodeFromId('start-new') || new Diagram.NodeStartModel({ id: 'start-new' })
      startNode.setPosition(startX, startY)
      // this.clearAllLinksForNode('start-new')
      this.addNode(startNode)
      startX += START_AND_END_NODE_WIDTH
      prevNodes = [startNode]
    }

    pipeline.items?.forEach((node, index) => {
      const resp = this.renderGraphNodes({
        node,
        startX,
        startY,
        selectedStageId: selectedId,
        disableCollapseButton: hideCollapseButton,
        diagramContainerHeight,
        prevNodes,
        showEndNode,
        groupStage,
        isFirstNode: index === 0
      })
      startX = resp.startX
      startY = resp.startY
      /* istanbul ignore else */ if (resp.prevNodes) {
        prevNodes = resp.prevNodes
      }
    })

    /* istanbul ignore else */ if (showStartEndNode && showEndNode) {
      // Stop Node
      const stopNode =
        this.getNodeFromId('stop-node') || new Diagram.NodeStartModel({ id: 'stop-node', icon: 'stop', isStart: false })
      // this.clearAllLinksForNode('stop-node')
      startX += FIRST_AND_LAST_SEGMENT_LENGTH
      stopNode.setPosition(startX, startY)
      const lastNode = last(prevNodes)
      /* istanbul ignore else */ if (lastNode) {
        this.connectedParentToNode(
          stopNode,
          lastNode,
          false,
          0,
          getArrowsColor(
            pipeline.status || /* istanbul ignore next */ ExecutionStatusEnum.NotStarted,
            false,
            false,
            true
          )
        )
      }
      this.addNode(stopNode)
    }

    const nodes = this.getActiveNodeLayer().getNodes()
    for (const key in nodes) {
      const node = nodes[key]
      if (
        pipeline.allNodes.indexOf(node.getID()) === -1 &&
        node.getID() !== STATIC_SERVICE_GROUP_NAME &&
        !(node instanceof Diagram.NodeStartModel) &&
        !(node instanceof Diagram.EmptyNodeModel)
      ) {
        node.remove()
        this.activeNodeLayer.removeModel(node.getID())
      } else {
        node.registerListener(listeners.nodeListeners)
      }
    }
    const links = this.getActiveLinkLayer().getLinks()
    for (const key in links) {
      const link = links[key]
      link.registerListener(listeners.linkListeners)
    }

    this.stepGroupLayers.forEach(layer => {
      layer.registerListener(listeners.layerListeners)
      const nodesInLayer = layer.getNodes()
      for (const key in nodesInLayer) {
        const node = nodesInLayer[key]
        if (
          pipeline.allNodes.indexOf(node.getID()) === -1 &&
          !(node instanceof Diagram.NodeStartModel) &&
          !(node instanceof Diagram.EmptyNodeModel)
        ) {
          node.remove()
          layer.removeModel(node.getID())
        } else {
          node.registerListener(listeners.nodeListeners)
        }
      }
    })
    // Lock the graph back
    this.setLocked(true)
  }
}

/**
 * Workaround solution to make Out port of Empty node visible
 */
function makeVisibleOutPortOnEmptyNode(emptyNodeId: string) {
  const el = document.querySelector('*[data-nodeid="' + emptyNodeId + '"]')
  if ((el?.firstChild?.childNodes?.[1] as HTMLElement)?.style?.visibility) {
    ;(el!.firstChild!.childNodes[1]! as HTMLElement)!.style!.visibility = 'visible'
  }
}
