import SSKSPluginPassword from '@seald-io/sdk-plugin-ssks-password'
import SealdSDK from '@seald-io/sdk-web'

export const apiURL = 'https://api.staging.tiefighter.seald.io/'
export const keyStorageURL = 'https://ssks.soyouz.seald.io/'
export const appId = '3631b4a0-7e2a-42d9-92ec-ce72c4815cc3'

const domainValidationKeyId = '514b79cf-d1e8-4f3b-8893-cf410542cb8d'
const domainValidationKey = 's0oFWH6XA7ijsXvMIIutruksCTZn4Fm1elSO6rrv1DPXN6O3WkboGNFARv1uIO8v'

let seald = null

const connectSeald = () => SealdSDK({ apiURL, appId, plugins: [SSKSPluginPassword(keyStorageURL)] })

export const createSealdSDK = async ({ userId, password }) => {
  seald = connectSeald()
  const userLicenseToken = await seald.utils.generateUserLicenseToken(userId, domainValidationKey, domainValidationKeyId)
  await seald.initiateIdentity({ userId, userLicenseToken })
  await seald.ssksPassword.saveIdentity({ userId, password })

  const defaultUser = await seald.goatee.account.getDefaultUser()
  console.log('DEFAULT USER ID: ' + defaultUser.id)
}

export const retrieveSealdSDK = async ({ userId, password }) => {
  seald = connectSeald()
  await seald.ssksPassword.retrieveIdentity({ userId, password })
  const defaultUser = await seald.goatee.account.getDefaultUser()
  console.log('DEFAULT USER ID: ' + defaultUser.id)
}

export const createEncryptedSession = ({ userIds, metadata }) => seald.createEncryptionSession({ userIds }, { metadata })

export const retrieveEncryptedSession = arg => seald.retrieveEncryptionSession(arg)
