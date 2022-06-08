/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const deploymentExecutionMock = {
  data: {
    executionDeploymentList: [
      {
        date: 1621125462238,
        deployments: {
          total: 0,
          success: 0,
          failure: 0
        }
      },
      {
        date: 1621125462238,
        deployments: {
          total: 0,
          success: 0,
          failure: 0
        }
      },
      {
        date: 1621125462238,
        deployments: {
          total: 0,
          success: 0,
          failure: 0
        }
      }
    ]
  }
}

export const deploymentHealthMock = {
  data: {
    healthDeploymentInfo: {
      total: {
        count: 19,
        production: 5,
        nonProduction: 2,
        countList: [
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 6
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 11
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 2
            }
          }
        ]
      },
      success: {
        count: 8,
        rate: 700.0,
        countList: [
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 6
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 2
            }
          }
        ]
      },
      failure: {
        count: 1,
        rate: 0.0,
        countList: [
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 1
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            deployments: {
              count: 0
            }
          }
        ]
      }
    }
  }
}

export const deploymentsMock = {
  data: {
    failure: [
      {
        name: 'twoStagetwoSer',
        startTs: 1621039062238,
        endTs: 1621125462238,
        status: 'FAILED',
        serviceInfoList: [
          {
            serviceName: 'service2',
            serviceTag: null
          },
          {
            serviceName: 'service1',
            serviceTag: null
          }
        ]
      }
    ],
    pending: [
      {
        name: 'p1',
        startTs: 1621039062238,
        endTs: 1621125462238,
        status: 'PENDING',
        serviceInfoList: [
          {
            serviceName: 'service1',
            serviceTag: null
          },
          {
            serviceName: 'service1',
            serviceTag: null
          }
        ]
      }
    ],
    active: [
      {
        name: 'RunningPipeline',
        startTs: 1621039062238,
        endTs: 1621125462238,
        status: 'RUNNING',
        serviceInfoList: [
          {
            serviceName: 'service1',
            serviceTag: null
          },
          {
            serviceName: 'service1',
            serviceTag: null
          }
        ]
      }
    ]
  }
}

export const workloadsMock = {
  data: {
    workloadDeploymentInfoList: [
      {
        name: 'springboot',
        buildCount: 7,
        percentSuccess: 0.0,
        successRate: -100.0,
        lastCommit: 'Update test.txt',
        lastExecuted: {
          startTime: 1621555606947,
          endTime: 1621556205569
        },
        countList: [
          {
            time: 1621125462238,
            builds: {
              count: 3
            }
          },
          {
            time: 1621125462238,
            builds: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            builds: {
              count: 1
            }
          },
          {
            time: 1621125462238,
            builds: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            builds: {
              count: 0
            }
          },
          {
            time: 1621125462238,
            builds: {
              count: 3
            }
          },
          {
            time: 1621125462238,
            builds: {
              count: 0
            }
          }
        ]
      }
    ]
  }
}
