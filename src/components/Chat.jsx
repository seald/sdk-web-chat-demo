import React, { memo, useContext, useEffect, useRef } from 'react'
import { Redirect } from 'react-router-dom'
import { Avatar, Box, FormControl, IconButton, InputBase, makeStyles, Paper, Tooltip, Typography } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit'
import GroupAddIcon from '@material-ui/icons/GroupAdd'
import SendIcon from '@material-ui/icons/Send'
import Skeleton from '@material-ui/lab/Skeleton'
import { useSnackbar } from 'notistack'
import { useImmer } from 'use-immer'

import useQuery from '../hooks/useQuery'
import { addMessage, db } from '../services/firebase'
import { createEncryptedSession, retrieveEncryptedSession } from '../services/seald'
import { START_EDIT_DIALOG_ROOM } from '../stores/reducer/constants'
import { SocketContext } from '../stores/SocketContext'
import { filterWithoutCurrentUser } from '../utils/index'
import GroupAvatar from './GroupAvatar'
import Message from './Message'

const useStyles = makeStyles(theme => ({
  root: {
    height: '70vh'
  },
  formControl: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  input: {
    flexGrow: 1
  },
  sendButton: {
    color: theme.palette.grey[500],
    marginLeft: 5
  },
  smallAvatar: {
    width: theme.spacing(3),
    height: theme.spacing(3),
    marginRight: theme.spacing(1)
  },
  messageWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: theme.spacing(1)
  },
  messageLine: {
    '&:last-child > div': {
      marginBottom: 0
    },
    '&:first-child': {
      marginTop: 'auto'
    }
  }
}))

function Chat() {
  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()
  const [{ currentUser, users }, dispatch] = useContext(SocketContext)
  const currentRoomId = useQuery().get('id')
  const list = useRef(null)
  const sealdSessionRef = useRef(null)
  const [state, setState] = useImmer({
    room: {},
    messages: [],
    message: '',
    users: {},
    isCustomRoom: false,
    isRoomInvalid: false,
    isLoading: true
  })

  useEffect(() => {
    const currentMessagesRef = db.ref(`messages/${currentRoomId}`)

    const init = async () => {
      const isOneToOne = currentRoomId.includes(currentUser.uid)
      const currentRoom = isOneToOne
        ? await db
            .ref(`one-to-one/${currentRoomId}`)
            .once('value')
            .then(snp => snp.val())
        : await db
            .ref(`rooms/${currentRoomId}`)
            .once('value')
            .then(snp => snp.val())
      if (currentRoom) {
        if (!(currentUser.uid in currentRoom.users)) {
          enqueueSnackbar('Access denied', { variant: 'error' })
          setState(draft => {
            draft.isRoomInvalid = true
          })
        } else {
          setState(draft => {
            draft.message = ''
            draft.isLoading = false
            draft.isCustomRoom = !!currentRoom.createdBy
            draft.room = {
              ...currentRoom,
              uid: currentRoomId
            }
            draft.users = currentRoom.users
            draft.hasAccess = currentUser.uid in currentRoom.users
            draft.messages = []
          })
          sealdSessionRef.current = null

          currentMessagesRef.on('value', async snp => {
            const messages = Object.entries(snp.val() || {})
              .map(([id, { message, timestamp, user }]) => ({ id, message, timestamp, user }))
              .sort((a, b) => a.timestamp - b.timestamp)

            if (messages.length) {
              if (!sealdSessionRef.current) {
                sealdSessionRef.current = await retrieveEncryptedSession({ encryptedMessage: messages[0].message })
              }
              setState(draft => {
                const newMessages = messages.filter(m => draft.messages.every(n => n.id !== m.id))
                draft.messages.push(
                  ...newMessages.map(m => ({
                    message: sealdSessionRef.current.decrypt(m.message),
                    timestamp: m.timestamp,
                    user: m.user,
                    id: m.id
                  }))
                )
              })
            }
            list.current.scrollTop = list.current.scrollHeight
          })
        }
      } else {
        enqueueSnackbar('This room does not exist', { variant: 'error' })
        setState(draft => {
          draft.isRoomInvalid = true
        })
      }
    }

    if (currentRoomId && currentUser) {
      init()
    } else {
      setState(draft => {
        draft.room = {}
        draft.messages = []
        draft.message = ''
      })
    }
    return () => {
      currentMessagesRef.off()
    }
  }, [currentRoomId, setState, currentUser, enqueueSnackbar])

  useEffect(() => {
    if (state.room.uid && state.isCustomRoom) {
      const roomDbRef = db.ref(`rooms/${state.room.uid}`)
      roomDbRef.on('value', snp => {
        const room = snp.val()

        if (!room) {
          setState(draft => {
            draft.isRoomInvalid = true
          })
          enqueueSnackbar('Room does not exist or has been removed!', { variant: 'error' })
        } else if (!(currentUser.uid in room.users)) {
          enqueueSnackbar('Access denied', { variant: 'error' })
          setState(draft => {
            draft.isRoomInvalid = true
          })
        } else {
          setState(draft => {
            draft.room = {
              ...room,
              uid: state.room.uid
            }
            draft.users = room.users
          })
        }
      })
      return () => {
        roomDbRef.off()
      }
    }
  }, [state.room.uid, setState, currentUser, state.isCustomRoom, enqueueSnackbar])

  const handleEditRoom = () => {
    dispatch({
      type: START_EDIT_DIALOG_ROOM,
      payload: {
        roomUid: state.room.uid,
        roomName: state.room.roomName,
        sealdSession: sealdSessionRef.current,
        selectedUidUsers: Object.keys(state.users)
      }
    })
  }

  const handleSubmitMessage = async e => {
    e.preventDefault()
    if (!state.room.uid) {
      enqueueSnackbar('Please select a room or create a new one', { variant: 'error' })
    } else if (state.message.trim()) {
      try {
        if (!sealdSessionRef.current) {
          sealdSessionRef.current = await createEncryptedSession({
            userIds: Object.keys(state.room.users),
            metadata: state.room.uid
          })
        }
        const encryptedMessage = await sealdSessionRef.current.encrypt(state.message)
        await addMessage({
          roomId: state.room.uid,
          message: encryptedMessage
        })
        setState(draft => {
          draft.message = ''
        })
      } catch (error) {
        console.error(error)
        enqueueSnackbar(error.message, { variant: 'error' })
      }
    }
  }

  if (state.isRoomInvalid) return <Redirect to="/rooms" />

  const usersRoom = Object.fromEntries(Object.entries(users).filter(([key]) => key in state.users))
  const canCustom = state.isCustomRoom && currentUser.uid === state.room.createdBy
  const title = state.isCustomRoom
    ? state.room.roomName
    : Object.values(filterWithoutCurrentUser(usersRoom, currentUser))[0]?.displayName

  return (
    <Box display="flex" className={classes.root} flexDirection="column" bgcolor="background.paper">
      <Paper elevation={1}>
        <Box
          p={2}
          flexShrink={0}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          bgcolor="grey.200"
          color="primary.main"
          height="80px"
        >
          <Box display="flex" flexGrow={1} alignItems="center">
            {state.isLoading && (
              <Skeleton width="30%">
                <Typography>.</Typography>
              </Skeleton>
            )}
            {!state.isLoading && (
              <>
                <Typography variant="h6" component="h1">
                  {title}
                </Typography>
                {canCustom && (
                  <IconButton
                    style={{
                      marginLeft: 5
                    }}
                    edge="start"
                    size="small"
                    color="secondary"
                    aria-label="edit room"
                    component="span"
                    onClick={handleEditRoom}
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </>
            )}
          </Box>

          <Box display="flex" alignItems="center">
            {state.isLoading && (
              <>
                <Skeleton variant="circle">
                  <Avatar />
                </Skeleton>
                <Skeleton variant="circle">
                  <Avatar />
                </Skeleton>
              </>
            )}
            {!state.isLoading && (
              <>
                <GroupAvatar users={usersRoom} />
                {canCustom && (
                  <IconButton
                    style={{
                      marginLeft: 5
                    }}
                    edge="start"
                    size="small"
                    color="secondary"
                    aria-label="edit room"
                    component="span"
                    onClick={handleEditRoom}
                  >
                    <GroupAddIcon />
                  </IconButton>
                )}
              </>
            )}
          </Box>
        </Box>
      </Paper>
      <Box p={1} style={{ overflowY: 'scroll' }} ref={list} display="flex" flexDirection="column" flexGrow={1}>
        {Array.from(state.messages).map(m => {
          const authorUid = m.user
          const isCurrentUser = authorUid === currentUser.uid
          const member = users[authorUid]
          return (
            <Box
              width="100%"
              display="flex"
              justifyContent={isCurrentUser ? 'flex-end' : 'flex-start'}
              key={m.id}
              className={classes.messageLine}
            >
              <Box className={classes.messageWrapper}>
                {!isCurrentUser && (
                  <Tooltip title={member.displayName}>
                    <Avatar className={classes.smallAvatar} sizes="small" src={member.photoURL} />
                  </Tooltip>
                )}
                <Message isCurrentUser={isCurrentUser} value={m.message} />
              </Box>
            </Box>
          )
        })}
      </Box>
      <Box p={2} style={{ paddingBottom: 4, paddingTop: 4 }} flexShrink={0} bgcolor="grey.100">
        <form noValidate onSubmit={handleSubmitMessage}>
          <FormControl disabled={state.isLoading} className={classes.formControl} variant="filled">
            <InputBase
              value={state.message}
              onChange={e => {
                const value = e.target.value
                setState(draft => {
                  draft.message = value
                })
              }}
              className={classes.input}
              placeholder="Type a message"
              inputProps={{ 'aria-label': 'type message' }}
            />

            <IconButton
              className={classes.sendButton}
              edge="start"
              disabled={state.isLoading}
              size="medium"
              color="primary"
              aria-label="send message"
              component="button"
              type="submit"
            >
              <SendIcon />
            </IconButton>
          </FormControl>
        </form>
      </Box>
    </Box>
  )
}

export default memo(Chat)
