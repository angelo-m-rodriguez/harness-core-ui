import * as licenseStoreContextMock from 'framework/LicenseStore/LicenseStoreContext'
import * as moduleMock from '../useModuleInfo'
import { useAnyEnterpriseLicense, useCurrentEnterpriseLicense } from '../useModuleLicenses'

describe('useModuleLicenses tests', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  describe('useAnyEnterpriseLicense tests', () => {
    test('should return true when one license is enterprise and paid', () => {
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CI: { edition: 'ENTERPRISE', licenseType: 'PAID' },
          CD: { edition: 'FREE', licenseType: 'TRIAL' }
        }
      } as any)

      expect(useAnyEnterpriseLicense()).toBe(true)
    })

    test('should return false when one license is enterprise but not paid', () => {
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CI: { edition: 'ENTERPRISE', licenseType: 'TRIAL' },
          CD: { edition: 'FREE', licenseType: 'TRIAL' }
        }
      } as any)

      expect(useAnyEnterpriseLicense()).toBe(false)
    })

    test('should return false when no licenses are enterprise and paid', () => {
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CI: { edition: 'FREE', licenseType: 'PAID' },
          CD: { edition: 'FREE', licenseType: 'TRIAL' }
        }
      } as any)

      expect(useAnyEnterpriseLicense()).toBe(false)
    })
  })

  describe('useCurrentEnterpriseLicense tests', () => {
    test('should return true when current license is enterprise and paid', () => {
      jest.spyOn(moduleMock, 'useModuleInfo').mockReturnValue({
        module: 'cd'
      })
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CD: { edition: 'ENTERPRISE', licenseType: 'PAID' }
        }
      } as any)

      expect(useCurrentEnterpriseLicense()).toBe(true)
    })

    test('should return false when current license is enterprise but not paid', () => {
      jest.spyOn(moduleMock, 'useModuleInfo').mockReturnValue({
        module: 'cd'
      })
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CD: { edition: 'ENTERPRISE', licenseType: 'TRIAL' }
        }
      } as any)

      expect(useCurrentEnterpriseLicense()).toBe(false)
    })

    test('should return false when current licenses is not enterprise or paid', () => {
      jest.spyOn(moduleMock, 'useModuleInfo').mockReturnValue({
        module: 'cd'
      })
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CD: { edition: 'FREE', licenseType: 'PAID' }
        }
      } as any)

      expect(useCurrentEnterpriseLicense()).toBe(false)
    })
  })
})
