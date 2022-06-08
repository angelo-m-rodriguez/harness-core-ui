/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { IconName, Utils } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { defaultTo, isEmpty, uniq } from 'lodash-es'
import type { PipelineInfoConfig, StageElementWrapperConfig } from 'services/cd-ng'
import type { UseStringsReturn } from 'framework/strings'
import { getStageType } from '@pipeline/utils/templateUtils'
import { EmptyStageName } from '../PipelineConstants'
import type { StagesMap } from '../PipelineContext/PipelineContext'
import { getCommonStyles, EmptyNodeSeparator, Listeners } from './StageBuilderUtil'
import {
  CreateNewModel,
  DefaultNodeModel,
  DiagramModel,
  DiamondNodeModel,
  EmptyNodeModel,
  GroupNodeModel,
  NodeStartModel
} from '../../Diagram'

export interface AddUpdateGraphProps {
  data: PipelineInfoConfig
  listeners: Listeners
  stagesMap: StagesMap
  zoomLevel: number
  getString: UseStringsReturn['getString']
  isReadonly: boolean
  selectedStageId?: string
  splitPaneSize?: number
  parentPath: string
  errorMap: Map<string, string[]>
  templateTypes: { [key: string]: string }
}

export interface StageBuilderConfiguration {
  FIRST_AND_LAST_SEGMENT_LENGTH: number
  SPACE_BETWEEN_ELEMENTS: number
  LINE_SEGMENT_LENGTH: number
  PARALLEL_LINES_WIDTH: number
  NODE_WIDTH: number
  GROUP_NODE_WIDTH: number
  START_AND_END_NODE_WIDTH: number
}

export interface RenderGraphNodeProps {
  node: StageElementWrapperConfig
  startX: number
  startY: number
  stagesMap: StagesMap
  isReadonly: boolean
  zoomLevel: number
  getString: UseStringsReturn['getString']
  selectedStageId?: string
  splitPaneSize?: number
  prevNodes?: DefaultNodeModel[]
  allowAdd?: boolean
  isFirstNode?: boolean
  isParallelNode?: boolean
  parentPath: string
  errorMap: Map<string, string[]>
  templateTypes: { [key: string]: string }
}

export class StageBuilderModel extends DiagramModel {
  protected diagConfig: StageBuilderConfiguration

  constructor() {
    super({
      gridSize: 100,
      startX: 50,
      startY: 60,
      /*gapX: 200, deprecated */
      gapY: 100
    })

    this.diagConfig = {
      FIRST_AND_LAST_SEGMENT_LENGTH: 56,
      SPACE_BETWEEN_ELEMENTS: 80,
      LINE_SEGMENT_LENGTH: 30,
      PARALLEL_LINES_WIDTH: 60, // NOTE: LINE_SEGMENT_LENGTH * 2
      NODE_WIDTH: 90,
      GROUP_NODE_WIDTH: 90,
      START_AND_END_NODE_WIDTH: 30
    }
  }

  renderGraphNodes(props: RenderGraphNodeProps): { startX: number; startY: number; prevNodes?: DefaultNodeModel[] } {
    const {
      node,
      startY,
      stagesMap,
      isReadonly,
      selectedStageId,
      splitPaneSize,
      getString,
      zoomLevel,
      allowAdd,
      isFirstNode = false,
      isParallelNode = false,
      parentPath,
      errorMap,
      templateTypes
    } = props
    const {
      FIRST_AND_LAST_SEGMENT_LENGTH,
      SPACE_BETWEEN_ELEMENTS,
      PARALLEL_LINES_WIDTH,
      NODE_WIDTH,
      GROUP_NODE_WIDTH
    } = this.diagConfig
    let { startX, prevNodes } = props
    if (node && node.stage) {
      const isTemplateStage = !!node.stage?.template
      const type = stagesMap[getStageType(node?.stage, templateTypes)]
      const hasErrors = errorMap && [...errorMap.keys()].some(key => parentPath && key.startsWith(parentPath))

      startX += isFirstNode
        ? FIRST_AND_LAST_SEGMENT_LENGTH
        : isParallelNode
        ? PARALLEL_LINES_WIDTH
        : SPACE_BETWEEN_ELEMENTS

      const isSelected = selectedStageId === node.stage.identifier
      const nodeRender = type?.isApproval
        ? new DiamondNodeModel({
            identifier: node.stage.identifier,
            id: node.stage.identifier,
            customNodeStyle: {
              // Without this doesn't look straight
              marginTop: '1px',
              ...getCommonStyles(isSelected)
            },
            name: node.stage.name,
            width: 57,
            isInComplete: node.stage.name === EmptyStageName || hasErrors,
            canDelete: !(selectedStageId === node.stage.identifier || isReadonly),
            draggable: !isReadonly,
            height: 57,
            conditionalExecutionEnabled: node.stage.when
              ? node.stage.when?.pipelineStatus !== 'Success' || !!node.stage.when?.condition?.trim()
              : false,
            isTemplate: isTemplateStage,
            iconStyle: { color: isSelected ? Utils.getRealCSSColor(Color.WHITE) : type?.iconColor },
            icon: type?.icon
          })
        : new DefaultNodeModel({
            identifier: node.stage.identifier,
            id: node.stage.identifier,
            customNodeStyle: getCommonStyles(isSelected),
            name: node.stage.name,
            isInComplete: node.stage.name === EmptyStageName || hasErrors,
            width: 90,
            defaultSelected: isSelected,
            draggable: !isReadonly,
            canDelete: !(selectedStageId === node.stage.identifier || isReadonly),
            conditionalExecutionEnabled: node.stage.when
              ? node.stage.when?.pipelineStatus !== 'Success' || !!node.stage.when?.condition?.trim()
              : false,
            isTemplate: isTemplateStage,
            allowAdd: allowAdd === true && !isReadonly,
            height: 40,
            iconStyle: { color: isSelected ? Utils.getRealCSSColor(Color.WHITE) : type?.iconColor },
            icon: type?.icon,
            ...(node.stage.when && {})
          })

      this.addNode(nodeRender)
      nodeRender.setPosition(startX, startY)
      /* istanbul ignore else */ if (!isEmpty(prevNodes) && prevNodes) {
        prevNodes.forEach((prevNode: DefaultNodeModel) => {
          this.connectedParentToNode(nodeRender, prevNode, !isParallelNode && !isReadonly)
        })
      }
      startX += NODE_WIDTH
      return { startX, startY, prevNodes: [nodeRender] }
    } /* istanbul ignore else */ else if (node?.parallel && prevNodes) {
      /* istanbul ignore else */ if (node.parallel.length > 1) {
        const splitSize = defaultTo(splitPaneSize, 0)
        // Simple nodes which can render is available space is
        const simpleNodes = Math.floor(splitSize / ((this.gapY * zoomLevel) / 100))
        if (splitSize < this.gapY * node.parallel.length + 40 && simpleNodes === 1) {
          const parallelStageNames: Array<string> = []
          let isSelected = false
          const icons: Array<IconName> = []
          node.parallel.forEach(nodeP => {
            const type = stagesMap[getStageType(nodeP?.stage, templateTypes)]
            if (nodeP.stage?.identifier === selectedStageId) {
              parallelStageNames.unshift(nodeP.stage?.name ?? '')
              icons.unshift(type?.icon)
              isSelected = true
            } else {
              parallelStageNames.push(nodeP.stage?.name || '')
              icons.push(type?.icon)
            }
          })
          const groupedNode = new GroupNodeModel({
            customNodeStyle: getCommonStyles(isSelected),
            identifier: isSelected ? selectedStageId : node.parallel[0].stage?.identifier,
            id: isSelected ? selectedStageId : node.parallel[0].stage?.identifier,
            parallelNodes: node.parallel.map(nodeP => defaultTo(nodeP?.stage?.identifier, '')),
            name:
              parallelStageNames.length > 2
                ? getString('pipeline.parallelSelectedStages', {
                    selected: parallelStageNames[0],
                    total: parallelStageNames.length - 1
                  })
                : parallelStageNames.join(', '),
            width: GROUP_NODE_WIDTH,
            allowAdd: true,
            height: 40,
            icons: uniq(icons)
          })
          startX += isFirstNode ? FIRST_AND_LAST_SEGMENT_LENGTH : SPACE_BETWEEN_ELEMENTS
          this.addNode(groupedNode)
          groupedNode.setPosition(startX, startY)
          if (!isEmpty(prevNodes) && prevNodes) {
            prevNodes.forEach((prevNode: DefaultNodeModel) => {
              this.connectedParentToNode(groupedNode, prevNode, !isParallelNode)
            })
          }
          startX += GROUP_NODE_WIDTH
          prevNodes = [groupedNode]
        } else {
          let newX = startX
          let newY = startY

          /* istanbul ignore else */ if (!isEmpty(prevNodes)) {
            const emptyNodeStart = new EmptyNodeModel({
              identifier: `${EmptyNodeSeparator}-${EmptyNodeSeparator}${node.parallel[0].stage?.identifier}${EmptyNodeSeparator}`,
              name: 'Empty',
              hideOutPort: true
            })
            this.addNode(emptyNodeStart)
            newX += isFirstNode ? FIRST_AND_LAST_SEGMENT_LENGTH : SPACE_BETWEEN_ELEMENTS
            emptyNodeStart.setPosition(newX, newY)
            prevNodes.forEach((prevNode: DefaultNodeModel) => {
              this.connectedParentToNode(emptyNodeStart, prevNode, true)
            })
            prevNodes = [emptyNodeStart]
          }
          const prevNodesAr: DefaultNodeModel[] = []
          node.parallel.every((nodeP, index: number) => {
            const isLastNode = node.parallel?.length === index + 1
            if (index + 1 < simpleNodes || node.parallel?.length === simpleNodes) {
              const resp = this.renderGraphNodes({
                node: nodeP,
                startX: newX,
                startY: newY,
                stagesMap,
                isReadonly,
                getString,
                selectedStageId,
                zoomLevel,
                splitPaneSize,
                prevNodes,
                allowAdd: isLastNode,
                isParallelNode: true,
                parentPath: `${parentPath}.parallel.${index}`,
                errorMap,
                templateTypes
              })
              startX = resp?.startX
              newY = resp?.startY + this.gapY
              /* istanbul ignore else */ if (resp?.prevNodes) {
                prevNodesAr.push(...resp.prevNodes)
              }
              return true
            } else {
              const parallelStageNames: Array<string> = []
              const parallelNodes = defaultTo(node.parallel?.slice(index), [])
              let isSelected = false
              const icons: Array<IconName> = []
              parallelNodes.forEach(nodePP => {
                const type = stagesMap[getStageType(nodePP?.stage, templateTypes)]
                if (nodePP.stage?.identifier === selectedStageId) {
                  parallelStageNames.unshift(nodePP.stage?.name ?? '')
                  icons.unshift(type?.icon)
                  isSelected = true
                } else {
                  parallelStageNames.push(nodePP.stage?.name || '')
                  icons.push(type?.icon)
                }
              })
              const groupedNode = new GroupNodeModel({
                customNodeStyle: getCommonStyles(isSelected),
                identifier: isSelected ? selectedStageId : parallelNodes[0].stage?.identifier,
                id: isSelected ? selectedStageId : parallelNodes[0].stage?.identifier,
                parallelNodes: parallelNodes.map(nodePP => defaultTo(nodePP?.stage?.identifier, '')),
                name: isSelected
                  ? getString('pipeline.parallelSelectedStages', {
                      selected: parallelStageNames[0],
                      total: parallelStageNames.length - 1
                    })
                  : getString('pipeline.parallelStages', { total: parallelStageNames.length }),
                width: GROUP_NODE_WIDTH,
                allowAdd: true,
                height: 40,
                icons: uniq(icons)
              })
              this.addNode(groupedNode)
              groupedNode.setPosition(newX + PARALLEL_LINES_WIDTH - 18, newY)
              if (!isEmpty(prevNodes) && prevNodes) {
                prevNodes.forEach((prevNode: DefaultNodeModel) => {
                  this.connectedParentToNode(groupedNode, prevNode, !isParallelNode)
                })
              }
              prevNodesAr.push(groupedNode)
              return false
            }
          })
          /* istanbul ignore else */ if (!isEmpty(prevNodesAr)) {
            const emptyNodeEnd = new EmptyNodeModel({
              identifier: `${EmptyNodeSeparator}${node.parallel[0].stage?.identifier}${EmptyNodeSeparator}`,
              name: 'Empty',
              hideInPort: true
            })
            this.addNode(emptyNodeEnd)
            startX += PARALLEL_LINES_WIDTH
            emptyNodeEnd.setPosition(startX, startY)
            prevNodesAr.forEach((prevNode: DefaultNodeModel) => {
              this.connectedParentToNode(emptyNodeEnd, prevNode, false)
            })
            prevNodes = [emptyNodeEnd]
          }
        }
      } else {
        return this.renderGraphNodes({
          node: node.parallel[0],
          startX,
          startY,
          stagesMap,
          isReadonly,
          selectedStageId,
          getString,
          splitPaneSize,
          zoomLevel,
          prevNodes,
          allowAdd: true,
          isParallelNode: false,
          parentPath: `${parentPath}.0`,
          errorMap,
          templateTypes
        })
      }
      return { startX, startY, prevNodes }
    }
    return { startX, startY }
  }

  addUpdateGraph(props: AddUpdateGraphProps): void {
    const {
      data,
      listeners,
      stagesMap,
      getString,
      zoomLevel,
      isReadonly,
      selectedStageId,
      splitPaneSize,
      parentPath = '',
      errorMap,
      templateTypes
    } = props
    const { START_AND_END_NODE_WIDTH, FIRST_AND_LAST_SEGMENT_LENGTH, SPACE_BETWEEN_ELEMENTS, NODE_WIDTH } =
      this.diagConfig
    let { startX, startY } = this
    this.clearAllNodesAndLinks() // TODO: Improve this

    // Unlock Graph
    this.setLocked(false)

    //Start Node
    const startNode = new NodeStartModel()
    startNode.setPosition(startX, startY)
    this.addNode(startNode)
    startX += START_AND_END_NODE_WIDTH

    // Stop Node
    const stopNode = new NodeStartModel({ icon: 'stop', isStart: false })

    // Create Node
    const createNode = new CreateNewModel({
      id: 'create-node',
      width: 90,
      height: 40,
      name: getString('addStage'),
      customNodeStyle: { borderColor: 'var(--pipeline-grey-border)' }
    })

    let prevNodes: DefaultNodeModel[] = [startNode]
    data?.stages?.forEach((node, index: number) => {
      const resp = this.renderGraphNodes({
        node,
        startX,
        startY,
        stagesMap,
        isReadonly,
        selectedStageId,
        splitPaneSize,
        zoomLevel,
        getString,
        prevNodes,
        allowAdd: true,
        parentPath: `${parentPath}.${index}`,
        errorMap,
        isFirstNode: index === 0,
        templateTypes
      })
      startX = resp.startX
      startY = resp.startY
      /* istanbul ignore else */ if (resp.prevNodes) {
        prevNodes = resp.prevNodes
      }
    })

    if (isReadonly) {
      startX += FIRST_AND_LAST_SEGMENT_LENGTH
      stopNode.setPosition(startX, startY)
      prevNodes.forEach((prevNode: DefaultNodeModel) => {
        this.connectedParentToNode(stopNode, prevNode, false)
      })
      this.addNode(stopNode)
    } else {
      startX += isEmpty(data?.stages) ? FIRST_AND_LAST_SEGMENT_LENGTH : SPACE_BETWEEN_ELEMENTS
      createNode.setPosition(startX, startY)
      startX += NODE_WIDTH + FIRST_AND_LAST_SEGMENT_LENGTH
      stopNode.setPosition(startX, startY)
      prevNodes.forEach((prevNode: DefaultNodeModel) => {
        this.connectedParentToNode(createNode, prevNode, false)
      })
      this.connectedParentToNode(stopNode, createNode, false)
      this.addNode(stopNode)
      this.addNode(createNode)
    }

    const nodes = this.getActiveNodeLayer().getNodes()
    for (const key in nodes) {
      const node = nodes[key]
      node.registerListener(listeners.nodeListeners)
    }
    const links = this.getActiveLinkLayer().getLinks()
    for (const key in links) {
      const link = links[key]
      link.registerListener(listeners.linkListeners)
    }
    // Lock the graph back
    this.setLocked(true)
  }
}
