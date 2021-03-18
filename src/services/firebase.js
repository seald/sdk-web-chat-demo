// This import loads the firebase namespace.
import firebase from 'firebase/app'

import { encodePassword, scrypt } from '../utils'

// These imports load individual services into the firebase namespace.
import 'firebase/auth'
import 'firebase/database'

const config = {
  apiKey: 'AIzaSyD_GRR86MS65_LvhHxgh1zkBio8zzxLLNc',
  authDomain: 'chat-demo-sdk-web.firebaseapp.com',
  databaseURL: 'https://chat-demo-sdk-web.firebaseio.com',
  projectId: 'chat-demo-sdk-web',
  storageBucket: 'chat-demo-sdk-web.appspot.com',
  messagingSenderId: '224563068917',
  appId: '1:224563068917:web:05e4785ac26af34735aabc'
}

firebase.initializeApp(config)
export const auth = firebase.auth
export const db = firebase.database()

export const signUp = async ({ email, password, displayName }) => {
  const derivedPassword = (await scrypt(encodePassword(password), encodePassword(`seald-chat-demo|${email}`))).toString('hex')
  const { user } = await auth().createUserWithEmailAndPassword(email, derivedPassword)
  await db.ref(`users/${user.uid}`).set({
    displayName,
    timestamp: Date.now(),
    photoURL: `https://api.adorable.io/avatars/50/${user.uid}.png`,
    isOnline: true
  })
  return user
}

export const getCurrentUser = () => auth().currentUser

export const signIn = async ({ email, password }) => {
  const derivedPassword = (await scrypt(encodePassword(password), encodePassword(`seald-chat-demo|${email}`))).toString('hex')
  const { user } = await auth().signInWithEmailAndPassword(email, derivedPassword)
  return user
}

export const logout = async () => {
  const currentUser = await getCurrentUser()
  // DO NOT WAIT FOR IT
  db.ref(`users/${currentUser.uid}`).update({
    isOnline: false
  })
  await auth().signOut()
}

export const setOnline = async () => {
  const currentUser = await getCurrentUser()
  await db.ref(`users/${currentUser.uid}`).update({
    isOnline: true
  })
  return currentUser
}

export const setOffline = async () => {
  const currentUser = await getCurrentUser()
  await db.ref(`users/${currentUser.uid}`).update({
    isOnline: false
  })
}

export const addOneToOneRoom = async withUserUid => {
  const currentUserUid = await getCurrentUser().uid
  const roomId = currentUserUid < withUserUid ? currentUserUid + '_' + withUserUid : withUserUid + '_' + currentUserUid
  return db.ref(`one-to-one/${roomId}`).set({
    timestamp: Date.now(),
    lastMessage: '',
    users: {
      [withUserUid]: true,
      [currentUserUid]: true
    }
  })
}

export const editCustomRoom = async ({ usersUid = [], roomName, roomUid }) => {
  const currentUserUid = await getCurrentUser().uid
  const roomDbRef = db.ref(`rooms/${roomUid}`)
  const currentRoom = await roomDbRef.once('value').then(snp => snp.val())
  if (!currentRoom) throw new Error('Room does not exist!')
  await roomDbRef.update({
    timestamp: Date.now(),
    roomName: roomName,
    users: usersUid.reduce(
      (previousValue, currentValue) => {
        previousValue[currentValue] = true
        return previousValue
      },
      { [currentUserUid]: true }
    )
  })
}

export const addCustomRoom = async ({ usersUid = [], roomName }) => {
  const currentUserUid = await getCurrentUser().uid
  return db.ref(`rooms`).push({
    timestamp: Date.now(),
    lastMessage: '',
    roomName,
    createdBy: currentUserUid,
    users: usersUid.reduce(
      (previousValue, currentValue) => {
        previousValue[currentValue] = true
        return previousValue
      },
      { [currentUserUid]: true }
    )
  })
}

export const removeCustomRoom = async ({ roomUid }) => {
  const currentUserUid = await getCurrentUser().uid
  const roomDbRef = db.ref(`rooms/${roomUid}`)
  const currentRoom = await roomDbRef.once('value').then(snp => snp.val())
  if (!currentRoom) throw new Error('Room does not exist!')
  if (currentRoom.createdBy !== currentUserUid) throw new Error('Permission denied!')
  await roomDbRef.remove()
  db.ref(`messages/${roomUid}`).remove()
}

export const addMessage = async ({ roomId, message }) => {
  await db.ref(`messages/${roomId}`).push({
    user: await getCurrentUser().uid,
    timestamp: Date.now(),
    message
  })
}
