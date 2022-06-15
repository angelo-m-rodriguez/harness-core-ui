/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export enum Editions {
  ENTERPRISE = 'ENTERPRISE',
  TEAM = 'TEAM',
  FREE = 'FREE',
  COMMUNITY = 'COMMUNITY'
}

export enum ModuleLicenseType {
  TRIAL = 'TRIAL',
  PAID = 'PAID',
  FREE = 'FREE',
  COMMUNITY = 'COMMUNITY'
}

export enum RestrictionType {
  AVAILABILITY = 'AVAILABILITY',
  STATIC_LIMIT = 'STATIC_LIMIT',
  RATE_LIMIT = 'RATE_LIMIT',
  CUSTOM = 'CUSTOM'
}

export enum SUBSCRIPTION_TAB_NAMES {
  OVERVIEW = 'OVERVIEW',
  PLANS = 'PLANS',
  BILLING = 'BILLING'
}

export enum CD_LICENSE_TYPE {
  SERVICES = 'SERVICES',
  SERVICE_INSTANCES = 'SERVICE_INSTANCES'
}

export enum SubscribeViews {
  CALCULATE,
  BILLINGINFO,
  FINALREVIEW,
  SUCCESS
}
