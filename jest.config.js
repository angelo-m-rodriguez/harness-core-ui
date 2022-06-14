/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

process.env.TZ = 'GMT'
const { pathsToModuleNameMapper } = require('ts-jest/utils')
const { compilerOptions } = require('./tsconfig')

module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false
    },
    __DEV__: false,
    __ON_PREM__: false
  },
  setupFilesAfterEnv: ['<rootDir>/scripts/jest/setup-file.js', 'fake-indexeddb/auto', 'jest-canvas-mock'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/framework/app/App.tsx',
    '!src/framework/strings/languageLoader.ts',
    '!src/framework/AppStore/AppStoreContext.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__test__/**',
    '!src/**/__tests__/**',
    '!src/services/**',
    '!src/**/YamlBuilder.tsx',
    '!src/**/YAMLBuilderConstants.ts',
    '!src/**/*mock*.{ts,tsx}',
    '!src/**/*Mock*.{ts,tsx}',
    '!src/**/CreateConnectorFromYamlPage.tsx',
    '!src/**/CreateSecretFromYamlPage.tsx',
    '!src/**/PipelineYamlView.tsx',
    '!src/**/TemplateYamlView.tsx',
    '!src/**/RouteDestinations.tsx',
    '!src/modules/10-common/RouteDefinitions.ts',
    '!src/modules/10-common/utils/testUtils.tsx',
    '!src/modules/10-common/utils/JestFormHelper.ts',
    '!src/modules/85-cv/pages/metric-pack/**',
    '!src/modules/70-pipeline/components/PipelineStudio/PipelineContext/PipelineContext.tsx',
    '!src/modules/70-pipeline/components/PipelineStudio/ExecutionGraph/**',
    '!src/modules/25-governance/**', // 25-governance will be moved to a separate micro-frontend repository shortly
    '!src/modules/75-cd/factory/**'
  ],
  coverageReporters: ['lcov', 'json-summary', 'json'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'ts-jest',
    '^.+\\.ya?ml$': '<rootDir>/scripts/jest/yaml-transform.js',
    '^.+\\.gql$': '<rootDir>/scripts/jest/gql-loader.js'
  },
  moduleDirectories: ['node_modules', 'src'],
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
  moduleNameMapper: {
    '\\.s?css$': 'identity-obj-proxy',
    'monaco-editor': '<rootDir>/node_modules/react-monaco-editor',
    'worker-loader!.+': '<rootDir>/scripts/jest/file-mock.js',
    '@harness/monaco-yaml.*': '<rootDir>/scripts/jest/file-mock.js',
    '@wings-software/monaco-yaml.*': '<rootDir>/scripts/jest/file-mock.js',
    '\\.(jpg|jpeg|png|gif|svg|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/scripts/jest/file-mock.js',
    '@wings-software/(.*)': '<rootDir>/node_modules/@harness/$1',
    ...pathsToModuleNameMapper(compilerOptions.paths)
  },
  coverageThreshold: {
    global: {
      statements: 65,
      branches: 50,
      functions: 50,
      lines: 65
    }
  },
  transformIgnorePatterns: ['node_modules/(?!(date-fns|lodash-es|p-debounce)/)'],
  testPathIgnorePatterns: ['<rootDir>/dist']
}
