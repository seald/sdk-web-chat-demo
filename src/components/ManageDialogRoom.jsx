import React, { useCallback, useState } from 'react'
import { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import {
  Avatar,
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Typography
} from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import TextField from '@material-ui/core/TextField'
import { useSnackbar } from 'notistack'

import { addCustomRoom, addMessage, editCustomRoom } from '../services/firebase'
import {
  CLOSE_DIALOG_ROOM,
  FAILED_DIALOG_ROOM,
  SET_ROOM_NAME,
  SUCCESS_DIALOG_ROOM,
  TOGGLE_LOADING_ROOM,
  TOGGLE_SELECTED_USERS_ROOM
} from '../stores/reducer/constants'
import { SocketContext } from '../stores/SocketContext'

const useStyles = makeStyles(theme => {
  return {
    listUsers: {
      width: '100%',
      maxHeight: 200,
      overflowY: 'auto',
      padding: theme.spacing(1, 0),
      margin: theme.spacing(1, 0),
      backgroundColor: theme.palette.background.paper
    },
    you: {
      marginLeft: theme.spacing(1)
    }
  }
})

function ManageDialogRoom() {
  const { enqueueSnackbar } = useSnackbar()
  const history = useHistory()
  const [{ users, currentUser, dialogRoom }, dispatch] = useContext(SocketContext)
  const classes = useStyles()
  const [isErrorRoomName, setIsErrorRoomName] = useState(false)

  const handleToggle = useCallback(
    uid => () => {
      dispatch({
        type: TOGGLE_SELECTED_USERS_ROOM,
        payload: { uid }
      })
    },
    [dispatch]
  )

  const handleClose = useCallback(() => {
    dispatch({ type: CLOSE_DIALOG_ROOM })
    setIsErrorRoomName(false)
  }, [dispatch])

  const handleSubmit = async e => {
    e.preventDefault()
    if (dialogRoom.roomName.trim() === '') {
      setIsErrorRoomName(true)
      return
    }
    try {
      dispatch({ type: TOGGLE_LOADING_ROOM })
      if (dialogRoom.roomUid) {
        await editCustomRoom({
          roomName: dialogRoom.roomName,
          usersUid: dialogRoom.selectedUidUsers,
          roomUid: dialogRoom.roomUid
        })
      } else {
        const newRoom = await addCustomRoom({
          roomName: dialogRoom.roomName,
          usersUid: dialogRoom.selectedUidUsers
        })
        await addMessage({
          roomId: newRoom.key,
          message: 'Hello 👋'
        })
        history.push(`/rooms?id=${newRoom.key}`)
      }

      dispatch({ type: SUCCESS_DIALOG_ROOM })
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' })
      dispatch({ type: FAILED_DIALOG_ROOM })
      console.error(error)
    }
  }

  const { roomName, selectedUidUsers, isLoading, isOpen } = dialogRoom

  return (
    <Dialog open={isOpen} onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{dialogRoom.roomUid ? 'Edit room' : 'Add room'}</DialogTitle>
      <DialogContent>
        <DialogContentText>Name your room and select the users you want to chat with</DialogContentText>
        <TextField
          autoFocus
          error={isErrorRoomName}
          value={roomName}
          helperText={isErrorRoomName ? 'Incorrect entry' : ''}
          onChange={e => {
            const value = e.target.value
            setIsErrorRoomName(false)
            dispatch({
              type: SET_ROOM_NAME,
              payload: { roomName: value }
            })
          }}
          margin="dense"
          id="name"
          spellCheck="false"
          label="Room name"
          type="text"
          fullWidth
        />
        <List dense className={classes.listUsers}>
          {Object.keys(users)
            .sort(a => (a === currentUser.uid ? -1 : 0))
            .map(key => {
              const labelId = `checkbox-list-secondary-label-${key}`
              return (
                <ListItem key={key} button component="label" htmlFor={key}>
                  <ListItemAvatar>
                    <Avatar alt={users[key].displayName} src={users[key].photoURL} />
                  </ListItemAvatar>
                  <ListItemText
                    id={labelId}
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography>{users[key].displayName}</Typography>
                        {currentUser.uid === key && (
                          <Typography className={classes.you} variant="caption">
                            (you)
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge="end"
                      id={key}
                      disabled={currentUser.uid === key}
                      checked={currentUser.uid === key || selectedUidUsers.indexOf(key) !== -1}
                      onChange={handleToggle(key)}
                      inputProps={{ 'aria-labelledby': labelId }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              )
            })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ManageDialogRoom
