/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { get, isEmpty } from 'lodash-es'

import { Utils } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { ExecutionPipelineNodeType } from '@pipeline/components/ExecutionStageDiagram/ExecutionPipelineModel'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { UseStringsReturn } from 'framework/strings'
import type { ExecutionWrapperConfig, StepElementConfig } from 'services/cd-ng'
import { getIdentifierFromValue } from '@common/components/EntityReference/EntityReference'
import type { TemplateStepNode } from 'services/pipeline-ng'
import {
  DiagramModel,
  CreateNewModel,
  DefaultNodeModel,
  DiamondNodeModel,
  EmptyNodeModel,
  NodeStartModel,
  StepGroupNodeLayerModel,
  StepsType,
  IconNodeModel
} from '../../Diagram'
import {
  Listeners,
  StepStateMap,
  isCustomGeneratedString,
  STATIC_SERVICE_GROUP_NAME,
  DependenciesWrapper,
  calculateDepthPS
} from './ExecutionGraphUtil'
import { EmptyNodeSeparator } from '../StageBuilder/StageBuilderUtil'
import type { AbstractStepFactory } from '../../AbstractSteps/AbstractStepFactory'

export interface GridStyleInterface {
  gridSize?: number
  startX?: number
  startY?: number
  gapX?: number
  gapY?: number
}

export interface AddUpdateGraphProps {
  stepsData: ExecutionWrapperConfig[]
  stepStates: StepStateMap
  hasDependencies: boolean
  servicesData: DependenciesWrapper[]
  factory: AbstractStepFactory
  listeners: Listeners
  isRollback: boolean
  getString: UseStringsReturn['getString']
  isReadonly: boolean
  parentPath: string
  errorMap: Map<string, string[]>
  templateTypes: { [key: string]: string }
}

export interface RenderGraphStepNodesProps {
  node: ExecutionWrapperConfig
  startX: number
  startY: number
  factory: AbstractStepFactory
  isReadonly: boolean
  stepStates: StepStateMap
  isRollback?: boolean
  prevNodes?: DefaultNodeModel[]
  allowAdd?: boolean
  isFirstNode?: boolean
  isParallelNode?: boolean
  isStepGroupNode?: boolean
  isFirstStepGroupNode?: boolean
  getString?: UseStringsReturn['getString']
  parentPath: string
  errorMap: Map<string, string[]>
  templateTypes: { [key: string]: string }
}

// VERTICAL CONFIGURATION
const SPACE_AFTER_GROUP = 0.3
const GROUP_HEADER_DEPTH = 0.3

export interface ExecutionGraphConfiguration {
  FIRST_AND_LAST_SEGMENT_LENGTH: number
  SPACE_BETWEEN_ELEMENTS: number
  FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH: number
  LINE_SEGMENT_LENGTH: number
  PARALLEL_LINES_WIDTH: number
  LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP: number
  NODE_WIDTH: number
  START_AND_END_NODE_WIDTH: number
}

export function getExecutionPipelineNodeType(stepType?: string): ExecutionPipelineNodeType {
  if (stepType === StepType.Barrier) {
    return ExecutionPipelineNodeType.ICON
  }
  if (
    stepType === StepType.HarnessApproval ||
    stepType === StepType.JiraApproval ||
    stepType === StepType.ServiceNowApproval
  ) {
    return ExecutionPipelineNodeType.DIAMOND
  }

  return ExecutionPipelineNodeType.NORMAL
}

export class ExecutionStepModel extends DiagramModel {
  protected selectedNodeId?: string | undefined
  protected diagConfig: ExecutionGraphConfiguration

  constructor() {
    super({
      gridSize: 100,
      startX: 50,
      startY: 100,
      /*gapX: 200, deprecated */
      gapY: 140
    })

    this.diagConfig = {
      FIRST_AND_LAST_SEGMENT_LENGTH: 48,
      SPACE_BETWEEN_ELEMENTS: 72,
      FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH: 48,
      LINE_SEGMENT_LENGTH: 30,
      PARALLEL_LINES_WIDTH: 60, // NOTE: LINE_SEGMENT_LENGTH * 2
      LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP: 56, // 56
      NODE_WIDTH: 64,
      START_AND_END_NODE_WIDTH: 30
    }
  }

  setSelectedNodeId(selectedNodeId?: string): void {
    this.selectedNodeId = selectedNodeId
  }

  setGridStyle(style: GridStyleInterface): void {
    Object.assign(this, style)
  }

  setGraphConfiguration(diagConfig: Partial<ExecutionGraphConfiguration>): void {
    Object.assign(this.diagConfig, diagConfig)
  }

  renderGraphServiceNodes(
    services: DependenciesWrapper[],
    startX: number,
    startY: number,
    factory: AbstractStepFactory,
    stepStates: StepStateMap,
    isReadonly: boolean,
    prevNodes?: DefaultNodeModel[],
    getString?: UseStringsReturn['getString']
  ): { startX: number; startY: number; prevNodes?: DefaultNodeModel[] } {
    const { FIRST_AND_LAST_SEGMENT_LENGTH, LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP, NODE_WIDTH } = this.diagConfig

    const serviceState = stepStates.get(STATIC_SERVICE_GROUP_NAME)
    if (serviceState && serviceState.isStepGroupCollapsed) {
      startX += FIRST_AND_LAST_SEGMENT_LENGTH
      const nodeRender = new DefaultNodeModel({
        identifier: STATIC_SERVICE_GROUP_NAME,
        name: getString?.('pipelines-studio.dependenciesGroupTitle') as string,
        icon: factory.getStepIcon('StepGroup'),
        secondaryIcon: 'plus',
        draggable: false,
        allowAdd: false,
        canDelete: false,
        customNodeStyle: { borderColor: 'var(--pipeline-grey-border)', backgroundColor: '#55b8ec' }
      })
      this.addNode(nodeRender)
      nodeRender.setPosition(startX, startY)
      startX += NODE_WIDTH

      if (!isEmpty(prevNodes) && prevNodes) {
        prevNodes.forEach((prevNode: DefaultNodeModel) => {
          this.connectedParentToNode(nodeRender, prevNode, !isReadonly, 0)
        })
      }
      return { startX, startY, prevNodes: [nodeRender] }
    } else {
      const stepGroupLayer = new StepGroupNodeLayerModel({
        identifier: STATIC_SERVICE_GROUP_NAME,
        childrenDistance: this.gapY,
        label: getString?.('pipelines-studio.dependenciesGroupTitle') as string,
        depth: services.length + 1,
        headerDepth: GROUP_HEADER_DEPTH,
        allowAdd: false,
        showRollback: false
      })
      if (prevNodes && prevNodes.length > 0) {
        startX += FIRST_AND_LAST_SEGMENT_LENGTH
        stepGroupLayer.startNode.setPosition(startX, startY)
        prevNodes.forEach((prevNode: DefaultNodeModel) => {
          this.connectedParentToNode(stepGroupLayer.startNode, prevNode, !isReadonly)
        })
        prevNodes = [stepGroupLayer.startNode]
      }
      this.useStepGroupLayer(stepGroupLayer)

      let newY = startY
      startX += LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP

      const createNode = new CreateNewModel({
        name: getString?.('pipelines-studio.addDependency') as string,
        customNodeStyle: {
          borderColor: 'var(--pipeline-grey-border)'
        },
        showPorts: false,
        disabled: isReadonly
      })
      this.addNode(createNode)
      createNode.setPosition(startX, newY)
      if (prevNodes && prevNodes.length > 0) {
        prevNodes.forEach((prevNode: DefaultNodeModel) => {
          this.connectedParentToNode(createNode, prevNode, false, 0, 'var(--pipeline-transparent-border)')
        })
      }
      prevNodes = [createNode]

      newY += this.gapY
      services.forEach((service: DependenciesWrapper) => {
        const nodeRender = new DefaultNodeModel({
          identifier: service.identifier,
          name: service.name,
          icon: factory.getStepIcon(service.type),
          allowAdd: false,
          isInComplete: isCustomGeneratedString(service.identifier),
          draggable: true,
          customNodeStyle: { borderColor: 'var(--pipeline-grey-border)' },
          showPorts: false,
          selected: this.selectedNodeId === service.identifier
        })

        this.addNode(nodeRender)
        nodeRender.setPosition(startX, newY)
        if (!isEmpty(prevNodes) && prevNodes) {
          prevNodes.forEach((prevNode: DefaultNodeModel) => {
            this.connectedParentToNode(nodeRender, prevNode, false, 0, 'var(--pipeline-transparent-border)')
          })
        }
        prevNodes = [nodeRender]
        newY += this.gapY
      })

      startX += NODE_WIDTH + LEFT_AND_RIGHT_GAP_IN_SERVICE_GROUP

      if (prevNodes && prevNodes.length > 0) {
        stepGroupLayer.endNode.setPosition(startX, startY)
        prevNodes.forEach((prevNode: DefaultNodeModel) => {
          this.connectedParentToNode(stepGroupLayer.endNode, prevNode, false, 0, 'var(--pipeline-transparent-border)')
        })
        prevNodes = [stepGroupLayer.endNode]
      }
      this.useNormalLayer()

      return { startX, startY, prevNodes: prevNodes }
    }
  }

  renderGraphStepNodes(props: RenderGraphStepNodesProps): {
    startX: number
    startY: number
    prevNodes?: DefaultNodeModel[]
  } {
    const {
      node,
      factory,
      isReadonly,
      stepStates,
      isRollback = false,
      allowAdd,
      isFirstNode = false,
      isParallelNode = false,
      isStepGroupNode = false,
      isFirstStepGroupNode = false,
      getString,
      parentPath,
      errorMap,
      templateTypes
    } = props
    const {
      FIRST_AND_LAST_SEGMENT_LENGTH,
      SPACE_BETWEEN_ELEMENTS,
      FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH,
      LINE_SEGMENT_LENGTH,
      PARALLEL_LINES_WIDTH,
      NODE_WIDTH
    } = this.diagConfig

    let { startX, startY, prevNodes } = props
    if (node.step) {
      const isTemplateStep = !!(node.step as unknown as TemplateStepNode)?.template
      const stepType = isTemplateStep
        ? get(
            templateTypes,
            getIdentifierFromValue((node?.step as unknown as TemplateStepNode)?.template.templateRef)
          ) || ''
        : (node?.step as StepElementConfig)?.type
      const nodeType = getExecutionPipelineNodeType(stepType)
      const stepNode = (
        isTemplateStep ? (node.step as unknown as TemplateStepNode).template.templateInputs : node.step
      ) as StepElementConfig
      const hasErrors = errorMap && [...errorMap.keys()].some(key => parentPath && key.startsWith(parentPath))

      startX += isFirstNode
        ? FIRST_AND_LAST_SEGMENT_LENGTH
        : isFirstStepGroupNode
        ? FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
        : isParallelNode
        ? PARALLEL_LINES_WIDTH
        : SPACE_BETWEEN_ELEMENTS

      let stepIconColor = factory.getStepIconColor(stepType || '')
      const stepIconSize = factory.getStepIconSize(stepType || '')
      if (stepIconColor && Object.values(Color).includes(stepIconColor)) {
        stepIconColor = Utils.getRealCSSColor(stepIconColor)
      }
      const nodeRender =
        nodeType === ExecutionPipelineNodeType.DIAMOND
          ? new DiamondNodeModel({
              identifier: node.step.identifier,
              name: node.step.name,
              icon: factory.getStepIcon(stepType || ''),
              allowAdd: !isReadonly,
              canDelete: !isReadonly,
              draggable: !isReadonly,
              width: 57,
              height: 57,
              isInComplete: isCustomGeneratedString(node.step.identifier) || hasErrors,
              conditionalExecutionEnabled: stepNode?.when
                ? stepNode?.when?.stageStatus !== 'Success' || !!stepNode?.when?.condition?.trim()
                : false,
              isTemplate: isTemplateStep,
              customNodeStyle: { borderColor: 'var(--pipeline-grey-border)' },
              iconStyle: {
                color:
                  this.selectedNodeId === node.step.identifier
                    ? Utils.getRealCSSColor(Color.WHITE)
                    : stepIconColor ?? Utils.getRealCSSColor(Color.PRIMARY_5)
              },
              selected: this.selectedNodeId === node.step.identifier
            })
          : nodeType === ExecutionPipelineNodeType.ICON
          ? new IconNodeModel({
              identifier: node.step.identifier,
              name: node.step.name,
              icon: factory.getStepIcon(stepType || ''),
              allowAdd: allowAdd === true && !isReadonly,
              canDelete: !isReadonly,
              isInComplete: isCustomGeneratedString(node.step.identifier) || hasErrors,
              conditionalExecutionEnabled: stepNode?.when
                ? stepNode?.when?.stageStatus !== 'Success' || !!stepNode?.when?.condition?.trim()
                : false,
              draggable: !isReadonly,
              customNodeStyle: { borderColor: 'var(--pipeline-grey-border)' },
              iconSize: 50,
              iconStyle: {
                marginBottom: '38px'
              },
              selected: this.selectedNodeId === node.step.identifier
            })
          : new DefaultNodeModel({
              identifier: node.step.identifier,
              name: node.step.name,
              icon: factory.getStepIcon(stepType || ''),
              iconStyle: {
                width: stepIconSize,
                color: this.selectedNodeId === node.step.identifier ? Utils.getRealCSSColor(Color.WHITE) : stepIconColor
              },
              allowAdd: allowAdd === true && !isReadonly,
              isInComplete: isCustomGeneratedString(node.step.identifier) || hasErrors,
              conditionalExecutionEnabled: stepNode?.when
                ? stepNode?.when?.stageStatus !== 'Success' || !!stepNode?.when?.condition?.trim()
                : false,
              isTemplate: isTemplateStep,
              draggable: !isReadonly,
              canDelete: !isReadonly,
              customNodeStyle: { borderColor: 'var(--pipeline-grey-border)' },
              defaultSelected: this.selectedNodeId === node.step.identifier
            })

      this.addNode(nodeRender)
      nodeRender.setPosition(startX, startY)
      startX +=
        nodeType === ExecutionPipelineNodeType.DIAMOND || nodeType === ExecutionPipelineNodeType.ICON
          ? NODE_WIDTH + 30
          : NODE_WIDTH
      if (!isEmpty(prevNodes) && prevNodes) {
        prevNodes.forEach((prevNode: DefaultNodeModel) => {
          this.connectedParentToNode(
            nodeRender,
            prevNode,
            !isParallelNode && !isReadonly,
            isStepGroupNode ? 4 : 0,
            isStepGroupNode ? 'var(--pipeline-grey-border)' : 'var(--diagram-link)',
            { type: 'in', size: LINE_SEGMENT_LENGTH }
          )
        })
      }
      return { startX, startY, prevNodes: [nodeRender] }
    } else if (node.parallel && prevNodes) {
      if (node.parallel.length > 1) {
        let newX = startX
        let newY = startY
        if (prevNodes && node.parallel.length > 1) {
          const emptyNode = new EmptyNodeModel({
            identifier: node.parallel[0].step
              ? `${EmptyNodeSeparator}-${EmptyNodeSeparator}${node.parallel[0].step.identifier}${EmptyNodeSeparator}`
              : `${EmptyNodeSeparator}-${EmptyNodeSeparator}${node.parallel[0].stepGroup?.identifier}${EmptyNodeSeparator}`,
            name: 'Empty',
            hideOutPort: true
          })
          this.addNode(emptyNode)

          newX += isFirstNode
            ? FIRST_AND_LAST_SEGMENT_LENGTH
            : isFirstStepGroupNode
            ? FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
            : SPACE_BETWEEN_ELEMENTS

          emptyNode.setPosition(newX, newY)
          prevNodes.forEach((prevNode: DefaultNodeModel) => {
            this.connectedParentToNode(
              emptyNode,
              prevNode,
              !isReadonly,
              isStepGroupNode ? 4 : 0,
              isStepGroupNode ? 'var(--pipeline-grey-border)' : 'var(--diagram-link)'
            )
          })
          prevNodes = [emptyNode]
        }
        const prevNodesAr: DefaultNodeModel[] = []

        node.parallel.forEach((nodeP, index: number) => {
          const isLastNode = node.parallel?.length === index + 1
          const resp = this.renderGraphStepNodes({
            node: nodeP,
            startX: newX,
            startY: newY,
            factory,
            isReadonly,
            stepStates,
            isRollback,
            prevNodes,
            allowAdd: isLastNode,
            isParallelNode: true,
            isStepGroupNode,
            parentPath: `${parentPath}.parallel.${index}`,
            errorMap,
            templateTypes
          })
          if (resp.startX > startX) {
            startX = resp.startX
          }
          const depthYParallel = calculateDepthPS(nodeP, stepStates, SPACE_AFTER_GROUP, SPACE_AFTER_GROUP)
          newY = resp.startY + 140 * depthYParallel
          if (resp.prevNodes) {
            prevNodesAr.push(...resp.prevNodes)
          }
        })
        if (prevNodes && node.parallel.length > 1) {
          const emptyNodeEnd = new EmptyNodeModel({
            identifier: node.parallel[0].step
              ? `${EmptyNodeSeparator}${node.parallel[0].step.identifier}${EmptyNodeSeparator}`
              : `${EmptyNodeSeparator}${node.parallel[0].stepGroup?.identifier}${EmptyNodeSeparator}`,
            name: 'Empty',
            hideInPort: true
          })
          this.addNode(emptyNodeEnd)
          startX += PARALLEL_LINES_WIDTH
          emptyNodeEnd.setPosition(startX, startY)

          prevNodesAr.forEach((prevNode: DefaultNodeModel) => {
            this.connectedParentToNode(
              emptyNodeEnd,
              prevNode,
              false,
              isStepGroupNode ? 4 : 0,
              isStepGroupNode ? 'var(--pipeline-grey-border)' : 'var(--diagram-link)',
              { type: 'out', size: LINE_SEGMENT_LENGTH }
            )
          })
          prevNodes = [emptyNodeEnd]
        }

        return { startX, startY, prevNodes }
      } else if (node.parallel.length === 1) {
        return this.renderGraphStepNodes({
          node: node.parallel[0],
          startX,
          startY,
          factory,
          isReadonly,
          stepStates,
          isRollback,
          prevNodes,
          allowAdd: true,
          isParallelNode: true,
          isStepGroupNode,
          parentPath: `${parentPath}.parallel.${0}`,
          errorMap,
          templateTypes
        })
      }
    } else if (node.stepGroup) {
      const stepState = stepStates.get(node.stepGroup.identifier)
      if (stepState && stepState.isStepGroupCollapsed) {
        startX += isFirstNode
          ? FIRST_AND_LAST_SEGMENT_LENGTH
          : isFirstStepGroupNode
          ? FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
          : isParallelNode
          ? PARALLEL_LINES_WIDTH
          : SPACE_BETWEEN_ELEMENTS

        const nodeRender = new DefaultNodeModel({
          identifier: node.stepGroup.identifier,
          name: node.stepGroup.name || '',
          icon: factory.getStepIcon('StepGroup'),
          secondaryIcon: 'plus',
          draggable: !isReadonly,
          canDelete: !isReadonly,
          conditionalExecutionEnabled: node.stepGroup.when
            ? node.stepGroup.when?.stageStatus !== 'Success' || !!node.stepGroup.when?.condition?.trim()
            : false,
          allowAdd: allowAdd === true && !isReadonly,
          customNodeStyle: { borderColor: 'var(--pipeline-grey-border)', backgroundColor: '#55b8ec' }
        })

        this.addNode(nodeRender)
        nodeRender.setPosition(startX, startY)
        startX += NODE_WIDTH
        if (!isEmpty(prevNodes) && prevNodes) {
          prevNodes.forEach((prevNode: DefaultNodeModel) => {
            this.connectedParentToNode(nodeRender, prevNode, !isParallelNode && !isReadonly, 0, undefined, {
              type: 'in',
              size: LINE_SEGMENT_LENGTH
            })
          })
        }
        return { startX, startY, prevNodes: [nodeRender] }
      } else {
        const depthY = calculateDepthPS(node, stepStates, 0, SPACE_AFTER_GROUP)

        const stepGroupLayer = new StepGroupNodeLayerModel({
          identifier: node.stepGroup.identifier,
          childrenDistance: this.gapY,
          label: node.stepGroup.name,
          conditionalExecutionEnabled: node.stepGroup.when
            ? node.stepGroup.when?.stageStatus !== 'Success' || !!node.stepGroup.when?.condition?.trim()
            : false,
          inComplete: isCustomGeneratedString(node.stepGroup.identifier),
          depth: depthY,
          headerDepth: GROUP_HEADER_DEPTH,
          allowAdd: allowAdd === true && !isReadonly,
          showRollback: false,
          rollBackProps: {
            active: stepState?.isStepGroupRollback ? StepsType.Rollback : StepsType.Normal
          }
        })
        if (prevNodes && prevNodes.length > 0) {
          startX += isFirstNode
            ? FIRST_AND_LAST_SEGMENT_LENGTH
            : isParallelNode
            ? PARALLEL_LINES_WIDTH
            : SPACE_BETWEEN_ELEMENTS

          stepGroupLayer.startNode.setPosition(startX, startY)

          prevNodes.forEach((prevNode: DefaultNodeModel) => {
            this.connectedParentToNode(
              stepGroupLayer.startNode,
              prevNode,
              !isParallelNode && !isReadonly,
              isStepGroupNode ? 4 : 0,
              isStepGroupNode ? 'var(--pipeline-grey-border)' : 'var(--diagram-link)'
              // { type: 'in', size: LINE_SEGMENT_LENGTH }
            )
          })
          prevNodes = [stepGroupLayer.startNode]
        }
        this.useStepGroupLayer(stepGroupLayer)
        const steps = node.stepGroup.steps
        // Check if step group has nodes
        if (steps?.length > 0) {
          steps.forEach((nodeP, index: number) => {
            const resp = this.renderGraphStepNodes({
              node: nodeP,
              startX,
              startY,
              factory,
              isReadonly,
              stepStates,
              isRollback,
              prevNodes,
              allowAdd: true,
              isParallelNode: false,
              isStepGroupNode: true,
              isFirstStepGroupNode: index === 0,
              parentPath: `${parentPath}.stepGroup.steps.${index}`,
              errorMap,
              templateTypes
            })
            startX = resp.startX
            startY = resp.startY
            if (resp.prevNodes) {
              prevNodes = resp.prevNodes
            }
          })
        } else {
          // Else show Create Node
          const createNode = new CreateNewModel({
            name: getString?.('pipelines-studio.addStep'),
            identifier: `${EmptyNodeSeparator}${node.stepGroup.identifier}${EmptyNodeSeparator}`,
            customNodeStyle: { borderColor: 'var(--pipeline-grey-border)' },
            disabled: isReadonly
          })
          this.addNode(createNode)
          startX += FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
          createNode.setPosition(startX, startY)
          this.connectedParentToNode(createNode, stepGroupLayer.startNode, false, 4, 'var(--pipeline-grey-border)')
          prevNodes = [createNode]
          startX += NODE_WIDTH
        }
        if (prevNodes && prevNodes.length > 0) {
          startX += FIRST_AND_LAST_SEGMENT_IN_GROUP_LENGTH
          stepGroupLayer.endNode.setPosition(startX, startY)
          prevNodes.forEach((prevNode: DefaultNodeModel) => {
            this.connectedParentToNode(
              stepGroupLayer.endNode,
              prevNode,
              (steps?.length || 0) > 0 && !isReadonly,
              4,
              'var(--pipeline-grey-border)'
            )
          })
          prevNodes = [stepGroupLayer.endNode]
        }
        this.useNormalLayer()
        return { startX, startY, prevNodes: prevNodes }
      }
    }
    return { startX, startY }
  }

  addUpdateGraph(props: AddUpdateGraphProps): void {
    const {
      stepsData,
      stepStates,
      hasDependencies,
      servicesData,
      factory,
      listeners: { nodeListeners, linkListeners, layerListeners },
      isRollback,
      getString,
      isReadonly,
      parentPath,
      errorMap,
      templateTypes
    } = props
    const { FIRST_AND_LAST_SEGMENT_LENGTH, START_AND_END_NODE_WIDTH, SPACE_BETWEEN_ELEMENTS, NODE_WIDTH } =
      this.diagConfig
    let { startX, startY } = this
    this.clearAllNodesAndLinks()
    this.setLocked(false)

    // Start Node
    const startNode = new NodeStartModel({ id: 'start-new' })
    startNode.setPosition(startX, startY)
    this.addNode(startNode)
    startX += START_AND_END_NODE_WIDTH

    const tempStartX = startX

    // Stop Node
    const stopNode = new NodeStartModel({ icon: 'stop', isStart: false })

    // Create Node
    const createNode = new CreateNewModel({
      name: getString('pipelines-studio.addStep'),
      customNodeStyle: { borderColor: 'var(--pipeline-grey-border)' }
    })

    let prevNodes: DefaultNodeModel[] = [startNode]

    if (hasDependencies) {
      const servicesResp = this.renderGraphServiceNodes(
        servicesData,
        startX,
        startY,
        factory,
        stepStates,
        isReadonly,
        prevNodes,
        getString
      )
      startX = servicesResp.startX
      startY = servicesResp.startY
      if (servicesResp.prevNodes) {
        prevNodes = servicesResp.prevNodes
      }
    }

    stepsData.forEach((node, index: number) => {
      const resp = this.renderGraphStepNodes({
        node,
        startX,
        startY,
        factory,
        isReadonly,
        stepStates,
        isRollback,
        prevNodes,
        allowAdd: true,
        isParallelNode: false,
        isStepGroupNode: false,
        getString,
        parentPath: `${parentPath}.${index}`,
        errorMap,
        isFirstNode: index === 0 && !hasDependencies,
        templateTypes
      })
      startX = resp.startX
      startY = resp.startY
      if (resp.prevNodes) {
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
      if (tempStartX !== startX || stepsData.length === 0) {
        startX += stepsData.length === 0 ? FIRST_AND_LAST_SEGMENT_LENGTH : SPACE_BETWEEN_ELEMENTS
        createNode.setPosition(startX, startY)
      }
      prevNodes.forEach((prevNode: DefaultNodeModel) => {
        this.connectedParentToNode(createNode, prevNode, false)
      })
      this.addNode(createNode)
      startX += NODE_WIDTH + FIRST_AND_LAST_SEGMENT_LENGTH

      stopNode.setPosition(startX, startY)
      this.connectedParentToNode(stopNode, createNode, false)
      this.addNode(stopNode)
    }

    const nodes = this.getActiveNodeLayer().getNodes()
    for (const key in nodes) {
      const node = nodes[key]
      node.registerListener(nodeListeners)
    }
    const links = this.getActiveLinkLayer().getLinks()
    for (const key in links) {
      const link = links[key]
      link.registerListener(linkListeners)
    }

    this.stepGroupLayers.forEach(layer => {
      layer.registerListener(layerListeners)
      const nodesInLayer = layer.getNodes()
      for (const key in nodesInLayer) {
        const node = nodesInLayer[key]
        node.registerListener(nodeListeners)
      }
    })

    this.setLocked(true)
  }
}
