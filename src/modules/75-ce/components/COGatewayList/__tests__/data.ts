/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ResponsePageUserAggregate } from 'services/cd-ng'

export const mockedK8sServiceData = {
  id: 282,
  name: 'ravi-test-13',
  fulfilment: 'kubernetes',
  kind: 'k8s',
  cloud_account_id: 'Lightwing_Non_prod_old',
  idle_time_mins: 15,
  host_name: 'grateful-liger-c40gjtnsbqnjmr91f8n0.gateway.lightwing.io',
  custom_domains: null,
  match_all_subdomains: false,
  disabled: false,
  created_by: 'lv0euRhKRCyiXWzS7pOg6g',
  routing: {
    instance: null,
    lb: null,
    k8s: {
      RuleJson:
        '{"apiVersion":"lightwing.lightwing.io/v1","kind":"AutoStoppingRule","metadata":{"name":"ravi-test-13","annotations":{"harness.io/cloud-connector-id":"Lightwing_Non_prod_old","nginx.ingress.kubernetes.io/configuration-snippet":"more_set_input_headers \\"AutoStoppingRule: undefined-undefined-ravi-test-13\\";"}},"spec":{"idleTimeMins":15,"rules":[{"host":"caddyravi.cedevkubetest1.lightwingtest.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"caddy","port":{"number":80}}}}]}}]}}'
    },
    ports: []
  },
  health_check: {
    protocol: 'http',
    path: '/',
    port: 80,
    timeout: 30,
    id: ''
  },
  opts: {
    preserve_private_ip: false,
    delete_cloud_resources: false,
    always_use_private_ip: false
  },
  metadata: {
    custom_domain_providers: null,
    target_group_details: null,
    access_details: {
      backgroundTasks: {
        selected: false
      },
      dnsLink: {
        selected: false
      },
      ipaddress: {
        selected: false
      },
      rdp: {
        selected: false
      },
      ssh: {
        selected: false
      }
    },
    cloud_provider_details: {
      name: 'Lightwing Non prod old'
    },
    service_errors: null,
    kubernetes_connector_id: 'Ravi_test_14',
    health_check_details: null
  },
  access_point_id: null,
  status: 'created',
  created_at: '2021-07-28T07:40:38.420773Z',
  updated_at: '2021-07-28T07:40:38.420773Z',
  account_identifier: 'kmpySmUISimoRrJL6NL73w'
}

export const mockedInstanceServiceData = {
  id: 6115,
  name: 'test',
  fulfilment: 'ondemand',
  kind: 'instance',
  cloud_account_id: 'Lightwing_Non_Prod',
  idle_time_mins: 15,
  host_name: 'mighty-crawdad-c8e9dq1jlfm8dqjkon8g.sandeep.lightwing.io',
  custom_domains: null,
  match_all_subdomains: false,
  disabled: false,
  created_by: '-R-sOjJhQ7OTaLogtkGWSg',
  routing: {
    instance: {
      filter_text: 'name = ""\nvpc_id = ""\n\n[tags]\n  harnesslightwingrule = "c8e9dq8p8ai13r2j7a3g"',
      scale_group: null
    },
    lb: null,
    k8s: null,
    database: null,
    ports: [
      {
        id: 'arn:aws:elasticloadbalancing:us-east-1:357919113896:listener-rule/app/sandeep-test-lb/e2e95a1016c87ed7/c4638a556aa1655d/aa8d4e8c79f8da6a',
        protocol: 'http',
        target_protocol: 'http',
        port: 80,
        target_port: 80,
        server_name: '',
        action: 'forward',
        redirect_url: '',
        routing_rules: []
      }
    ],
    container_svc: null,
    custom_domain_providers: null
  },
  health_check: {
    protocol: 'http',
    path: '/',
    port: 80,
    timeout: 30,
    id: '',
    status_code_from: 200,
    status_code_to: 299
  },
  opts: {
    preserve_private_ip: false,
    delete_cloud_resources: false,
    always_use_private_ip: false,
    access_details: {
      backgroundTasks: {
        selected: false
      },
      dnsLink: {
        selected: true
      },
      ipaddress: {
        selected: false
      },
      rdp: {
        selected: false
      },
      ssh: {
        selected: false
      }
    },
    hide_progress_page: false
  },
  metadata: {
    target_group_details: {
      '80': 'arn:aws:elasticloadbalancing:us-east-1:357919113896:targetgroup/c8e9dqop8ai13r2j7a40/1168c1f0bf89e4cb'
    },
    access_details: null,
    cloud_provider_details: {
      name: 'Lightwing Non Prod'
    },
    service_errors: null,
    kubernetes_connector_id: '',
    health_check_details: null,
    custom_domain_providers: null,
    port_config: [
      {
        id: 'arn:aws:elasticloadbalancing:us-east-1:357919113896:listener-rule/app/sandeep-test-lb/e2e95a1016c87ed7/c4638a556aa1655d/aa8d4e8c79f8da6a',
        protocol: 'http',
        target_protocol: 'http',
        port: 80,
        target_port: 80,
        server_name: '',
        action: 'forward',
        redirect_url: '',
        routing_rules: []
      }
    ]
  },
  access_point_id: 'ap-c8aupomj83uermckpaa0',
  status: 'created',
  created_at: '2022-02-28T09:33:28.938197Z',
  updated_at: '2022-02-28T09:33:32.887936Z',
  account_identifier: 'wFHXHD0RRQWoO8tIZT5YVw'
}

export const mockedEcsServiceData = {
  id: 282,
  name: 'ecs-test-rule',
  fulfilment: 'kubernetes',
  kind: 'containers',
  cloud_account_id: 'Lightwing_Non_prod_old',
  idle_time_mins: 15,
  host_name: 'grateful-liger-c40gjtnsbqnjmr91f8n0.gateway.lightwing.io',
  custom_domains: null,
  match_all_subdomains: false,
  disabled: false,
  created_by: 'lv0euRhKRCyiXWzS7pOg6g',
  routing: {
    instance: null,
    lb: null,
    container_svc: {
      cluster: 'democluster',
      region: 'demoregion',
      service: 'demoservice',
      task_count: 2
    },
    ports: []
  },
  health_check: {
    protocol: 'http',
    path: '/',
    port: 80,
    timeout: 30,
    id: ''
  },
  opts: {
    preserve_private_ip: false,
    delete_cloud_resources: false,
    always_use_private_ip: false
  },
  metadata: {
    custom_domain_providers: null,
    target_group_details: null,
    access_details: {
      backgroundTasks: {
        selected: false
      },
      dnsLink: {
        selected: false
      },
      ipaddress: {
        selected: false
      },
      rdp: {
        selected: false
      },
      ssh: {
        selected: false
      }
    },
    cloud_provider_details: {
      name: 'Lightwing Non prod old'
    },
    service_errors: null,
    health_check_details: null
  },
  access_point_id: null,
  status: 'created',
  created_at: '2021-07-28T07:40:38.420773Z',
  updated_at: '2021-07-28T07:40:38.420773Z',
  account_identifier: 'kmpySmUISimoRrJL6NL73w'
}

export const mockedRdsServiceData = {
  id: 282,
  name: 'rds-test-rule',
  fulfilment: 'kubernetes',
  kind: 'database',
  cloud_account_id: 'Lightwing_Non_prod_old',
  idle_time_mins: 15,
  host_name: 'grateful-liger-c40gjtnsbqnjmr91f8n0.gateway.lightwing.io',
  custom_domains: null,
  match_all_subdomains: false,
  disabled: false,
  created_by: 'lv0euRhKRCyiXWzS7pOg6g',
  routing: {
    instance: null,
    lb: null,
    database: {
      id: 'demo_db_id',
      region: 'demoregion'
    },
    ports: []
  },
  health_check: {
    protocol: 'http',
    path: '/',
    port: 80,
    timeout: 30,
    id: ''
  },
  opts: {
    preserve_private_ip: false,
    delete_cloud_resources: false,
    always_use_private_ip: false
  },
  metadata: {
    custom_domain_providers: null,
    target_group_details: null,
    access_details: {
      backgroundTasks: {
        selected: false
      },
      dnsLink: {
        selected: false
      },
      ipaddress: {
        selected: false
      },
      rdp: {
        selected: false
      },
      ssh: {
        selected: false
      }
    },
    cloud_provider_details: {
      name: 'Lightwing Non prod old'
    },
    service_errors: null,
    health_check_details: null
  },
  access_point_id: null,
  status: 'created',
  created_at: '2021-07-28T07:40:38.420773Z',
  updated_at: '2021-07-28T07:40:38.420773Z',
  account_identifier: 'kmpySmUISimoRrJL6NL73w'
}

export const mockedEcsClusterServiceData = {
  name: 'ToDoApp',
  id: 'ToDoAppId',
  region: 'us-east-1',
  cluster: 'ToDoCluster',
  task_count: 2,
  loadbalanced: true,
  account_id: 'kmpySmUISimoRrJL6NL73w',
  cloud_account_id: 'Lightwing_Non_prod_old',
  capacity_provider: 'EC2'
}

export const mockedConnector = {
  connector: {
    name: 'dms-test',
    identifier: 'mock-kubernetes-id',
    description: '',
    orgIdentifier: null,
    projectIdentifier: null,
    tags: {},
    type: 'CEK8sCluster',
    spec: {
      connectorRef: 'cadfsdg',
      featuresEnabled: ['VISIBILITY']
    }
  },
  createdAt: 1632812028599,
  lastModifiedAt: 1632812028588,
  status: {
    status: 'SUCCESS',
    errorSummary: null,
    errors: null,
    testedAt: 1632812029812,
    lastTestedAt: 0,
    lastConnectedAt: 1632812029812
  },
  activityDetails: {
    lastActivityTime: 1632812028609
  },
  harnessManaged: false,
  gitDetails: {
    objectId: null,
    branch: null,
    repoIdentifier: null,
    rootFolder: null,
    filePath: null
  }
}

export const activeUserMock: ResponsePageUserAggregate = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 2,
    pageItemCount: 1,
    pageSize: 10,
    content: [
      {
        user: {
          name: 'Rishabh',
          email: 'abc@harness.io',
          uuid: '123',
          locked: false
        },
        roleAssignmentMetadata: [
          {
            identifier: 'role_assignment_vawmAV0YuQ9HlxmljpAu',
            roleIdentifier: '_account_admin',
            roleName: 'Account Admin',
            resourceGroupIdentifier: '_all_account_level_resources',
            resourceGroupName: 'All Resources',
            managedRole: true,
            managedRoleAssignment: false
          },
          {
            identifier: 'role_assignment_obm6QvdxtfqrlDzug31t',
            roleIdentifier: '_account_viewer',
            roleName: 'Account Viewer',
            resourceGroupIdentifier: '_all_account_level_resources',
            resourceGroupName: 'All Resources',
            managedRole: true,
            managedRoleAssignment: true
          }
        ]
      },
      {
        user: {
          name: 'abc2',
          email: 'abc2@harness.io',
          uuid: 'locked',
          locked: true
        },
        roleAssignmentMetadata: [
          {
            identifier: 'role_assignment_vawmAV0YuQ9HlxmljpAu',
            roleIdentifier: '_account_admin',
            roleName: 'Account Admin',
            resourceGroupIdentifier: '_all_account_level_resources',
            resourceGroupName: 'All Resources',
            managedRole: true,
            managedRoleAssignment: false
          },
          {
            identifier: 'role_assignment_obm6QvdxtfqrlDzug31t',
            roleIdentifier: '_account_viewer',
            roleName: 'Account Viewer',
            resourceGroupIdentifier: '_all_account_level_resources',
            resourceGroupName: 'All Resources',
            managedRole: true,
            managedRoleAssignment: true
          }
        ]
      }
    ],
    pageIndex: 0,
    empty: false
  },
  correlationId: ''
}
