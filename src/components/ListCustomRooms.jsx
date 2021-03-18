import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Box, IconButton, ListSubheader, Typography } from '@material-ui/core'
import Avatar from '@material-ui/core/Avatar'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemText from '@material-ui/core/ListItemText'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'

import { db } from '../services/firebase'
import { SocketContext } from '../stores/SocketContext'
import RemoveDialogRoom from './RemoveDialogRoom'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    overflowY: 'auto',
    height: '100%'
  },
  headerList: {
    zIndex: 2, // Above badge login
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText
  }
}))

const SmallAvatar = withStyles(theme => ({
  root: {
    width: 22,
    height: 22,
    border: `2px solid ${theme.palette.background.paper}`
  }
}))(Avatar)

function ListCustomRooms() {
  const [{ currentUser, users }] = useContext(SocketContext)
  const [rooms, setRooms] = useState({})
  const classes = useStyles()
  const modal = useRef(null)

  useEffect(() => {
    const roomsDbRef = db.ref('rooms')
    roomsDbRef.on('value', snp => {
      const rooms = Object.fromEntries(Object.entries(snp.val() || {}).filter(([, value]) => currentUser.uid in value.users))
      setRooms(rooms)
    })
    return () => {
      roomsDbRef.off()
    }
  }, [currentUser.uid])

  return (
    <>
      <List
        className={classes.root}
        subheader={
          <ListSubheader className={classes.headerList} display="flex" component={Box} id="nested-list-subheader">
            Rooms ({Object.keys(rooms).length})
          </ListSubheader>
        }
      >
        {Object.keys(rooms).map(key => {
          const room = rooms[key]
          const createdByUser = users[room.createdBy]
          const usersRooms = Object.entries(users)
            .filter(([key]) => key in room.users && key !== room.createdBy)
            .map(e => e[1])
          const hasMultiUsers = usersRooms.length > 0
          return (
            <ListItem
              key={key}
              button
              component={Link}
              to={{
                pathname: '/rooms',
                search: `?id=${key}`
              }}
            >
              <ListItemAvatar>
                {hasMultiUsers ? (
                  <Badge
                    overlap="circle"
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right'
                    }}
                    badgeContent={<SmallAvatar alt={usersRooms[0].displayName} src={usersRooms[0].photoURL} />}
                  >
                    <Avatar alt={createdByUser.displayName} src={createdByUser.photoURL} />
                  </Badge>
                ) : (
                  <Avatar alt={createdByUser.displayName} src={createdByUser.photoURL} />
                )}
              </ListItemAvatar>
              <ListItemText
                id={key}
                primary={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>{rooms[key].roomName}</Typography>
                    {currentUser.uid === rooms[key].createdBy && (
                      <IconButton
                        edge="start"
                        size="small"
                        color="inherit"
                        aria-label="add room"
                        component="span"
                        onClick={e => {
                          e.preventDefault()
                          modal.current.openDialog({
                            ...rooms[key],
                            uid: key
                          })
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                }
              />
            </ListItem>
          )
        })}
      </List>
      <RemoveDialogRoom ref={modal} />
    </>
  )
}

export default ListCustomRooms
