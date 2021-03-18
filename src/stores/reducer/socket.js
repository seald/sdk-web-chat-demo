import produce from 'immer'

import {
  CLOSE_DIALOG_ROOM,
  FAILED_DIALOG_ROOM,
  SET_AUTH,
  SET_ROOM_NAME,
  SET_USERS,
  START_ADD_DIALOG_ROOM,
  START_EDIT_DIALOG_ROOM,
  SUCCESS_DIALOG_ROOM,
  TOGGLE_SELECTED_USERS_ROOM
} from './constants'

const reducer = (state = {}, action) =>
  produce(state, draft => {
    switch (action.type) {
      case SET_AUTH:
        draft.currentUser = action.payload.currentUser
        break
      case SET_USERS:
        draft.users = action.payload.users
        break
      case START_EDIT_DIALOG_ROOM: {
        const { roomUid, selectedUidUsers, roomName } = action.payload
        draft.dialogRoom.isOpen = true
        draft.dialogRoom.roomUid = roomUid
        draft.dialogRoom.selectedUidUsers = selectedUidUsers
        draft.dialogRoom.roomName = roomName
        draft.dialogRoom.oldUidUsers = Object.freeze(selectedUidUsers)
        break
      }
      case START_ADD_DIALOG_ROOM:
        draft.dialogRoom.isOpen = true
        draft.dialogRoom.roomUid = null
        draft.dialogRoom.selectedUidUsers = []
        draft.dialogRoom.roomName = ''
        break
      case CLOSE_DIALOG_ROOM:
        draft.dialogRoom.isOpen = false
        break
      case TOGGLE_SELECTED_USERS_ROOM: {
        const { uid } = action.payload
        const currentIndex = state.dialogRoom.selectedUidUsers.indexOf(uid)
        if (currentIndex === -1) draft.dialogRoom.selectedUidUsers.push(uid)
        else draft.dialogRoom.selectedUidUsers.splice(currentIndex, 1)
        break
      }
      case SET_ROOM_NAME: {
        const { roomName } = action.payload
        draft.dialogRoom.roomName = roomName
        break
      }
      case SUCCESS_DIALOG_ROOM:
        draft.dialogRoom = {
          isOpen: false,
          roomUid: null,
          createdBy: null,
          selectedUidUsers: [],
          roomName: '',
          isLoading: false,
          oldUidUsers: []
        }
        break
      case FAILED_DIALOG_ROOM:
        draft.dialogRoom.isLoading = false
        break
      default:
        break
    }
    return draft
  })

export default reducer
