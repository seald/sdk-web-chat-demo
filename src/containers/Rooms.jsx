import React, { useContext, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Box, Container, Fab, Grid, makeStyles, Paper, Tooltip } from '@material-ui/core'
import AddCircleIcon from '@material-ui/icons/AddCircle'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import HomeIcon from '@material-ui/icons/Home'
import { useSnackbar } from 'notistack'

import Chat from '../components/Chat'
import ListCustomRooms from '../components/ListCustomRooms'
import ListOnlines from '../components/ListOnline'
import AddRoomDialog from '../components/ManageDialogRoom'
import Welcome from '../components/Welcome'
import useQuery from '../hooks/useQuery'
import { logout, setOffline, setOnline } from '../services/firebase'
import { SET_AUTH, START_ADD_DIALOG_ROOM } from '../stores/reducer/constants'
import { SocketContext } from '../stores/SocketContext'

const useStyles = makeStyles(theme => {
  return {
    root: {
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    paper: {
      width: '100%'
    },
    screenContainer: {
      height: '70vh',
      overflow: 'hidden',
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText
    },
    signOutIcon: {
      position: 'absolute',
      bottom: theme.spacing(2),
      right: theme.spacing(2)
    },
    addIcon: {
      position: 'absolute',
      bottom: theme.spacing(10),
      right: theme.spacing(2)
    },
    homeIcon: {
      position: 'absolute',
      bottom: theme.spacing(18),
      right: theme.spacing(2)
    }
  }
})

function Rooms() {
  const history = useHistory()
  const [, dispatch] = useContext(SocketContext)
  const currentRoomId = useQuery().get('id')
  const { enqueueSnackbar } = useSnackbar()
  const classes = useStyles()

  useEffect(() => {
    const leavePage = () => {
      setOffline()
      return undefined
    }
    window.addEventListener('onbeforeunload', leavePage)
    const manageOnlineActivity = async () => {
      try {
        await setOnline()
      } catch (error) {
        console.error(error)
        enqueueSnackbar(error.message, {
          variant: 'error'
        })
      }
    }
    manageOnlineActivity()
    return () => {
      window.removeEventListener('onbeforeunload', leavePage)
    }
  }, [enqueueSnackbar])

  const handleLogout = async () => {
    try {
      await logout()
      dispatch({ type: SET_AUTH, payload: { currentUser: null } })
      history.replace('/sign-in')
    } catch (error) {
      console.error(error)
      enqueueSnackbar(error.message, {
        variant: 'error'
      })
    }
  }

  return (
    <>
      <Container className={classes.root} component="main" maxWidth="md">
        <Paper elevation={3} className={classes.paper}>
          <Grid container className={classes.screenContainer}>
            <Grid item xs={5}>
              <Box height="70vh">
                <Box height="50%" flexGrow={1} style={{ overflow: 'hidden' }}>
                  <ListOnlines />
                </Box>
                <Box height="50%" flexGrow={1} style={{ overflow: 'hidden' }}>
                  <ListCustomRooms />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={7}>
              {currentRoomId ? <Chat /> : <Welcome />}
            </Grid>
          </Grid>
        </Paper>
        <Tooltip title="Sign out" placement="top">
          <Fab aria-label="Sign out" className={classes.signOutIcon} color="primary" onClick={handleLogout}>
            <ExitToAppIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="Add a room" placement="top">
          <Fab
            aria-label="add romm"
            className={classes.addIcon}
            color="primary"
            onClick={() =>
              dispatch({
                type: START_ADD_DIALOG_ROOM
              })
            }
          >
            <AddCircleIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="Back to Home" placement="top">
          <Fab aria-label="home" className={classes.homeIcon} color="primary" onClick={() => history.push('/rooms')}>
            <HomeIcon />
          </Fab>
        </Tooltip>
      </Container>
      <AddRoomDialog />
    </>
  )
}

export default Rooms
