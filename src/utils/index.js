import scryptJs from 'scrypt-js'

export const filterWithoutCurrentUser = (users, currentUser) =>
  Object.fromEntries(Object.entries(users).filter(([key]) => key !== currentUser.uid))

export const scrypt = (buff, salt) => scryptJs.scrypt(buff, salt, 16384, 8, 1, 64).then(res => Buffer.from(res)) // scryptJs returns Uint8Array so we convert it to a proper buffer to avoid problems

export const encodePassword = password => Buffer.from(password.normalize('NFKC'), 'utf8')
