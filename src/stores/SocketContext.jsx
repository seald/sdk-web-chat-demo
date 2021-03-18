import React, { useReducer } from 'react'

import reducer from './reducer/socket'

export const SocketContext = React.createContext()

const initialState = {
  currentUser: null,
  users: {},
  dialogRoom: {
    isOpen: false,
    roomUid: null,
    createdBy: null,
    selectedUidUsers: [],
    roomName: '',
    isLoading: false,
    oldUidUsers: []
  }
}

function SocketProvider({ children }) {
  const [state, updater] = useReducer(reducer, initialState)
  return <SocketContext.Provider value={[state, updater]}>{children}</SocketContext.Provider>
}

export default SocketProvider
