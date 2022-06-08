/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/**
 * Please match the config key to the directory under services.
 * This is required for the transform to work
 */
const customGenerator = require('../scripts/swagger-custom-generator.js')

module.exports = {
  portal: {
    output: 'src/services/portal/index.tsx',
    // url: 'https://localhost:9090/api/swagger.json',
    file: 'src/services/portal/swagger.json',
    validation: false,
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customGenerator: arg => customGenerator(arg, "getConfig('api')"),
    customProps: {
      base: `{getConfig("api")}`
    }
  },
  'cd-ng': {
    output: 'src/services/cd-ng/index.tsx',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("ng/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('ng/api')"),
    ...(process.env.cdng_schema_path
      ? { file: process.env.cdng_schema_path }
      : { url: 'http://localhost:7457/swagger.json' })
  },
  'pipeline-ng': {
    output: 'src/services/pipeline-ng/index.tsx',
    url: 'http://localhost:12001/api/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("pipeline/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('pipeline/api')")
  },
  'template-ng': {
    output: 'src/services/template-ng/index.tsx',
    url: 'http://localhost:15001/api/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("template/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('template/api')")
  },
  audit: {
    output: 'src/services/audit/index.tsx',
    url: 'http://localhost:9005/api/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("audit/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('audit/api')")
  },
  'dashboard-service': {
    output: 'src/services/dashboard-service/index.tsx',
    url: 'http://localhost:7100/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, GetUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("ng-dashboard/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('ng-dashboard/api')")
  },
  'custom-dashboards': {
    output: 'src/services/custom-dashboards/index.tsx',
    url: 'http://localhost:5000/static/swagger.yaml',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, GetUsingFetchProps, mutateUsingFetch, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("dashboard/")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('dashboard/')")
  },
  logs: {
    output: 'src/services/logs/index.tsx',
    file: 'src/services/logs/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, GetUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("log-service")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('log-service')")
  },
  notifications: {
    output: 'src/services/notifications/index.tsx',
    url: 'http://localhost:9005/api/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("notifications/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('notifications/api')")
  },
  resourcegroups: {
    output: 'src/services/resourcegroups/index.tsx',
    url: 'http://localhost:9005/api/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("resourcegroup/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('resourcegroup/api')")
  },
  rbac: {
    output: 'src/services/rbac/index.tsx',
    url: 'http://localhost:9006/api/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("authz/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('authz/api')")
  },
  ci: {
    output: 'src/services/ci/index.tsx',
    file: 'src/services/ci/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("ci")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('ci')")
  },
  'ti-service': {
    output: 'src/services/ti-service/index.tsx',
    file: 'src/services/ti-service/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig } from "../config";`,
    customProps: {
      base: `{getConfig("ti-service")}`
    }
  },
  cv: {
    output: 'src/services/cv/index.tsx',
    file: 'src/services/cv/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("cv/api")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('cv/api')")
  },
  cf: {
    output: 'src/services/cf/index.tsx',
    url: 'http://127.0.0.1:8085/docs/release/admin-v1.yaml',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig, getUsingFetch, mutateUsingFetch, GetUsingFetchProps, MutateUsingFetchProps } from "../config";`,
    customProps: {
      base: `{getConfig("cf")}`
    },
    customGenerator: arg => customGenerator(arg, "getConfig('cf')")
  },
  lw: {
    output: 'src/services/lw/index.tsx',
    file: 'src/services/lw/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig } from "../config";`,
    customProps: {
      base: `{getConfig("lw/api")}`
    }
  },
  ccm: {
    output: 'src/services/ce/index.tsx',
    file: 'src/services/ce/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig } from "../config";`,
    customProps: {
      base: `{getConfig("ccm/api")}`
    }
  },
  'ccm-recommender': {
    output: 'src/services/ce/recommenderService.tsx',
    file: 'src/services/ce/recommender-service.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig } from "../config";`,
    customProps: {
      base: `{getConfig("ccm/recommendations/api/v1")}`
    }
  },
  'ccm-public-pricing': {
    output: 'src/services/ce/publicPricingService.tsx',
    file: 'src/services/ce/public-pricing-service.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig } from "../config";`,
    customProps: {
      base: `{getConfig("ccm/public-pricing/api/v1")}`
    }
  },
  pm: {
    output: 'src/services/pm/index.tsx',
    file: 'src/services/pm/swagger.json',
    transformer: 'scripts/swagger-transform.js',
    customImport: `import { getConfig } from "../config";`,
    customProps: {
      base: `{getConfig("pm/api/v1")}`
    }
  }
}
