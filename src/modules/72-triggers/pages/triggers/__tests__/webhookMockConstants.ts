/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { PipelineInfoConfig } from 'services/cd-ng'
import type { WebhookTriggerConfigPanelPropsInterface } from '../views/WebhookTriggerConfigPanel'

export const originalPipeline = {
  name: 'pipeline-1',
  identifier: 'pipeline1',
  description: 'test',
  tags: undefined,
  stages: [
    {
      stage: {
        name: 's1',
        identifier: 's1',
        description: '',
        type: 'Deployment',
        spec: {
          service: {
            identifier: 'service1',
            name: 'service-1',
            description: '',
            serviceDefinition: {
              type: 'Kubernetes',
              spec: {
                artifacts: {
                  sidecars: []
                },
                manifests: [],
                artifactOverrideSets: [],
                manifestOverrideSets: []
              }
            },
            tags: null
          },
          infrastructure: {
            environment: {
              name: 'env1',
              identifier: 'env1',
              description: null,
              type: 'PreProduction'
            },
            infrastructureDefinition: {}
          },
          execution: {
            steps: [
              {
                step: {
                  name: 'Rollout Deployment',
                  identifier: 'rolloutDeployment',
                  type: 'K8sRollingDeploy',
                  spec: {
                    timeout: '10m',
                    skipDryRun: false
                  }
                }
              }
            ],
            rollbackSteps: [
              {
                step: {
                  name: 'Rollback Rollout Deployment',
                  identifier: 'rollbackRolloutDeployment',
                  type: 'K8sRollingRollback',
                  spec: {
                    timeout: '10m'
                  }
                }
              }
            ]
          }
        }
      }
    }
  ]
}

export const getTriggerConfigInitialValues = ({
  sourceRepo,
  secureToken
}: {
  sourceRepo?: string
  secureToken?: string
}): {
  identifier: string
  sourceRepo: string
  triggerType: string
  originalPipeline: PipelineInfoConfig
  secureToken?: string
} => ({
  identifier: '',
  sourceRepo: sourceRepo || 'Github',
  triggerType: 'Webhook',
  originalPipeline,
  secureToken
})

export const pipelineInputInitialValues = {
  identifier: '',
  originalPipeline: {
    identifier: 'p1',
    properties: {
      ci: {
        codebase: {
          connectorRef: 'github',
          build: '<+input>'
        }
      }
    },
    stages: [
      {
        stage: {
          identifier: 'stage1',
          type: 'Deployment',
          spec: {
            infrastructure: {
              infrastructureDefinition: {
                type: 'KubernetesDirect',
                spec: {
                  namespace: RUNTIME_INPUT_VALUE,
                  releaseName: RUNTIME_INPUT_VALUE
                }
              }
            }
          }
        }
      },
      {
        stage: {
          name: 'Stage 2',
          identifier: 'Stage2',
          type: 'CI',
          spec: {
            cloneCodebase: true,
            infrastructure: {
              type: 'KubernetesDirect',
              spec: {
                connectorRef: 'k8s',
                namespace: 'default'
              }
            },
            execution: {
              steps: [
                {
                  step: {
                    type: 'Run',
                    name: 'Run',
                    identifier: 'Run',
                    spec: {
                      connectorRef: 'docker',
                      image: 'node',
                      command: 'echo "test"'
                    }
                  }
                }
              ]
            }
          }
        }
      }
    ],
    variables: [{ name: 'newVar', type: 'String', value: '<+input>', default: 'defaultValue' }]
  },
  resolvedPipeline: {
    identifier: 'p1',
    properties: {
      ci: {
        codebase: {
          connectorRef: 'github',
          build: '<+input>'
        }
      }
    },
    stages: [
      {
        stage: {
          identifier: 'stage1',
          type: 'Deployment',
          spec: {
            infrastructure: {
              infrastructureDefinition: {
                type: 'KubernetesDirect',
                spec: {
                  namespace: RUNTIME_INPUT_VALUE,
                  releaseName: RUNTIME_INPUT_VALUE
                }
              }
            }
          }
        }
      },
      {
        stage: {
          name: 'Stage 2',
          identifier: 'Stage2',
          type: 'CI',
          spec: {
            cloneCodebase: true,
            infrastructure: {
              type: 'KubernetesDirect',
              spec: {
                connectorRef: 'k8s',
                namespace: 'default'
              }
            },
            execution: {
              steps: [
                {
                  step: {
                    type: 'Run',
                    name: 'Run',
                    identifier: 'Run',
                    spec: {
                      connectorRef: 'docker',
                      image: 'node',
                      command: 'echo "test"'
                    }
                  }
                }
              ]
            }
          }
        }
      }
    ],
    variables: [{ name: 'newVar', type: 'String', value: '<+input>', default: 'defaultValue' }]
  },
  pipeline: {
    identifier: 'p1',
    properties: {
      ci: {
        codebase: {
          connectorRef: 'github',
          build: '<+input>'
        }
      }
    },
    stages: [
      {
        stage: {
          identifier: 'stage1',
          type: 'Deployment',
          spec: {
            infrastructure: {
              infrastructureDefinition: {
                type: 'KubernetesDirect',
                spec: {
                  namespace: RUNTIME_INPUT_VALUE,
                  releaseName: RUNTIME_INPUT_VALUE
                }
              }
            }
          }
        }
      },
      {
        stage: {
          name: 'Stage 2',
          identifier: 'Stage2',
          type: 'CI',
          spec: {
            cloneCodebase: true,
            infrastructure: {
              type: 'KubernetesDirect',
              spec: {
                connectorRef: 'k8s',
                namespace: 'default'
              }
            },
            execution: {
              steps: [
                {
                  step: {
                    type: 'Run',
                    name: 'Run',
                    identifier: 'Run',
                    spec: {
                      connectorRef: 'docker',
                      image: 'node',
                      command: 'echo "test"'
                    }
                  }
                }
              ]
            }
          }
        }
      }
    ],
    variables: [{ name: 'newVar', type: 'String', value: '' }]
  },
  sourceRepo: 'GITHUB',
  triggerType: 'Webhook'
}
export const getTriggerConfigDefaultProps = ({
  isEdit = false
}: {
  isEdit?: boolean
}): WebhookTriggerConfigPanelPropsInterface => ({
  isEdit,
  formikProps: {
    values: {
      triggerType: 'Artifact',
      identifier: 'sdf',
      tags: {},
      artifactType: 'DockerRegistry',
      pipeline: {
        identifier: 'SampleTestArtifactsArchit',
        stages: [
          {
            stage: {
              identifier: 's1',
              type: 'Deployment',
              spec: {
                serviceConfig: {
                  serviceDefinition: {
                    type: 'Kubernetes',
                    spec: {
                      artifacts: {
                        primary: {
                          type: 'DockerRegistry',
                          spec: {
                            tag: '<+trigger.artifact.build>'
                          }
                        }
                      }
                    }
                  }
                },
                infrastructure: {
                  infrastructureDefinition: {
                    type: 'KubernetesDirect',
                    spec: {
                      namespace: 'sdfsdf'
                    }
                  }
                }
              }
            }
          }
        ]
      },
      originalPipeline: {
        name: 'SampleTestArtifactsArchit',
        identifier: 'SampleTestArtifactsArchit',
        allowStageExecutions: false,
        projectIdentifier: 'Kapil',
        orgIdentifier: 'default',
        tags: {},
        stages: [
          {
            stage: {
              name: 's1',
              identifier: 's1',
              description: '',
              type: 'Deployment',
              spec: {
                serviceConfig: {
                  serviceRef: 'architservice',
                  serviceDefinition: {
                    type: 'Kubernetes',
                    spec: {
                      variables: [],
                      artifacts: {
                        primary: {
                          spec: {
                            connectorRef: 'account.DockerAnonymous',
                            imagePath: 'library/nginx',
                            tag: '<+input>'
                          },
                          type: 'DockerRegistry'
                        },
                        sidecars: [
                          {
                            sidecar: {
                              spec: {
                                connectorRef: 'account.DockerAnonymous',
                                imagePath: 'library/nginx',
                                tag: 'latest'
                              },
                              identifier: 's1',
                              type: 'DockerRegistry'
                            }
                          }
                        ]
                      }
                    }
                  }
                },
                infrastructure: {
                  environmentRef: 'env9',
                  infrastructureDefinition: {
                    type: 'KubernetesDirect',
                    spec: {
                      connectorRef: 'pieplay',
                      namespace: '<+input>',
                      releaseName: 'release-<+INFRA_KEY>'
                    }
                  },
                  allowSimultaneousDeployments: false
                },
                execution: {
                  steps: [
                    {
                      step: {
                        type: 'ShellScript',
                        name: 'step1',
                        identifier: 'step1',
                        spec: {
                          shell: 'Bash',
                          onDelegate: true,
                          source: {
                            type: 'Inline',
                            spec: {
                              script:
                                'echo <+serviceConfig.serviceDefinition.spec.artifacts.primary.spec.connectorRef>\necho <+serviceConfig.serviceDefinition.spec.artifacts.sidecars.s1.spec.connectorRef>'
                            }
                          },
                          environmentVariables: [],
                          outputVariables: [],
                          executionTarget: {}
                        },
                        timeout: '10m'
                      }
                    }
                  ],
                  rollbackSteps: []
                }
              },
              tags: {},
              failureStrategies: [
                {
                  onFailure: {
                    errors: ['AllErrors'],
                    action: {
                      type: 'StageRollback'
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      resolvedPipeline: {
        name: 'SampleTestArtifactsArchit',
        identifier: 'SampleTestArtifactsArchit',
        allowStageExecutions: false,
        projectIdentifier: 'Kapil',
        orgIdentifier: 'default',
        tags: {},
        stages: [
          {
            stage: {
              name: 's1',
              identifier: 's1',
              description: '',
              type: 'Deployment',
              spec: {
                serviceConfig: {
                  serviceRef: 'architservice',
                  serviceDefinition: {
                    type: 'Kubernetes',
                    spec: {
                      variables: [],
                      artifacts: {
                        primary: {
                          spec: {
                            connectorRef: 'account.DockerAnonymous',
                            imagePath: 'library/nginx',
                            tag: '<+input>'
                          },
                          type: 'DockerRegistry'
                        },
                        sidecars: [
                          {
                            sidecar: {
                              spec: {
                                connectorRef: 'account.DockerAnonymous',
                                imagePath: 'library/nginx',
                                tag: 'latest'
                              },
                              identifier: 's1',
                              type: 'DockerRegistry'
                            }
                          }
                        ]
                      }
                    }
                  }
                },
                infrastructure: {
                  environmentRef: 'env9',
                  infrastructureDefinition: {
                    type: 'KubernetesDirect',
                    spec: {
                      connectorRef: 'pieplay',
                      namespace: '<+input>',
                      releaseName: 'release-<+INFRA_KEY>'
                    }
                  },
                  allowSimultaneousDeployments: false
                },
                execution: {
                  steps: [
                    {
                      step: {
                        type: 'ShellScript',
                        name: 'step1',
                        identifier: 'step1',
                        spec: {
                          shell: 'Bash',
                          onDelegate: true,
                          source: {
                            type: 'Inline',
                            spec: {
                              script:
                                'echo <+serviceConfig.serviceDefinition.spec.artifacts.primary.spec.connectorRef>\necho <+serviceConfig.serviceDefinition.spec.artifacts.sidecars.s1.spec.connectorRef>'
                            }
                          },
                          environmentVariables: [],
                          outputVariables: [],
                          executionTarget: {}
                        },
                        timeout: '10m'
                      }
                    }
                  ],
                  rollbackSteps: []
                }
              },
              tags: {},
              failureStrategies: [
                {
                  onFailure: {
                    errors: ['AllErrors'],
                    action: {
                      type: 'StageRollback'
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      inputSetTemplateYamlObj: {
        pipeline: {
          identifier: 'SampleTestArtifactsArchit',
          stages: [
            {
              stage: {
                identifier: 's1',
                type: 'Deployment',
                spec: {
                  serviceConfig: {
                    serviceDefinition: {
                      spec: {
                        artifacts: {
                          primary: {
                            type: 'DockerRegistry',
                            spec: {
                              tag: '<+input>'
                            }
                          },
                          sidecars: []
                        }
                      }
                    }
                  },
                  infrastructure: {
                    infrastructureDefinition: {
                      type: 'KubernetesDirect',
                      spec: {
                        namespace: '<+input>'
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      },
      selectedArtifact: {
        type: 'DockerRegistry',
        spec: {
          tag: '<+trigger.artifact.build>'
        }
      },
      name: 'sdf',
      stageId: 's1',
      stages: [
        {
          stage: {
            spec: {
              serviceConfig: {
                serviceDefinition: {
                  spec: {
                    artifacts: {
                      primary: {
                        type: 'DockerRegistry',
                        spec: {
                          tag: '<+trigger.artifact.build>'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }
  }
})
