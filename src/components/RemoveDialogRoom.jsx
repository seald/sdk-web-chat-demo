import React, { forwardRef, useImperativeHandle } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { useSnackbar } from 'notistack'
import { useImmer } from 'use-immer'

import { removeCustomRoom } from '../services/firebase'

function RemoveDialogRoom(props, ref) {
  const { enqueueSnackbar } = useSnackbar()
  const [state, setState] = useImmer({
    isOpen: false,
    room: null
  })

  useImperativeHandle(
    ref,
    () => ({
      openDialog: room =>
        setState(draft => {
          draft.room = room
          draft.isOpen = true
        })
    }),
    [setState]
  )

  const handleClose = () =>
    setState(draft => {
      draft.isOpen = false
    })

  const handleConfirm = async () => {
    try {
      await removeCustomRoom({ roomUid: state.room.uid })
      setState(draft => {
        draft.isOpen = false
      })
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' })
      console.error(error)
    }
  }

  return (
    <Dialog
      open={!!state.isOpen}
      onClose={handleClose}
      onExited={() =>
        setState(draft => {
          draft.room = null
        })
      }
      aria-labelledby="remove-room"
      aria-describedby={`remove-room-${state.room?.roomName}`}
    >
      <DialogTitle id="alert-dialog-title">Remove a room</DialogTitle>
      <DialogContent>
        <DialogContentText id="remove-room-description">
          Are you sure you want to remove the room <b>{state.room?.roomName}</b>?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="primary" autoFocus>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default forwardRef(RemoveDialogRoom)
