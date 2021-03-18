import React, { useContext, useEffect, useState } from 'react'
import { useCallback } from 'react'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { Box, ListSubheader, Typography } from '@material-ui/core'
import Avatar from '@material-ui/core/Avatar'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemText from '@material-ui/core/ListItemText'
import { makeStyles } from '@material-ui/core/styles'
import Skeleton from '@material-ui/lab/Skeleton'

import { addOneToOneRoom, db } from '../services/firebase'
import { SET_USERS } from '../stores/reducer/constants'
import { SocketContext } from '../stores/SocketContext'
import AvatarLogged from './AvatarLogged'

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
  },
  you: {
    marginLeft: theme.spacing(1)
  }
}))

function ListOnlines() {
  const [{ users, currentUser }, dispatch] = useContext(SocketContext)
  const classes = useStyles()
  const { path } = useRouteMatch()
  const history = useHistory()
  const [isLoading, setIsLoading] = useState(true)

  const redirectToRoom = useCallback(
    async key => {
      try {
        const userId1 = key
        const userId2 = currentUser.uid
        const roomId = userId1 < userId2 ? userId1 + '_' + userId2 : userId2 + '_' + userId1
        const roomExist = await db
          .ref(`one-to-one/${roomId}`)
          .once('value')
          .then(snp => snp.val())
        if (!roomExist) await addOneToOneRoom(userId1)
        history.push({
          pathname: path,
          search: `?id=${roomId}`
        })
      } catch (error) {
        console.error(error)
      }
    },
    [currentUser.uid, path, history]
  )

  useEffect(() => {
    const usersDbRef = db.ref('users')
    usersDbRef.on('value', snp => {
      const users = snp.val() || {}
      dispatch({
        type: SET_USERS,
        payload: {
          users
        }
      })
      setIsLoading(false)
    })

    return () => {
      usersDbRef.off()
    }
  }, [dispatch])

  return (
    <List
      className={classes.root}
      subheader={
        <ListSubheader className={classes.headerList} component="div" id="nested-list-subheader">
          Users ({Object.keys(users).length})
        </ListSubheader>
      }
    >
      {isLoading &&
        [1, 2, 3].map(i => (
          <ListItem key={i}>
            <ListItemAvatar>
              <Skeleton variant="circle">
                <Avatar />
              </Skeleton>
            </ListItemAvatar>
            <ListItemText>
              <Skeleton width="50%">
                <Typography>.</Typography>
              </Skeleton>
            </ListItemText>
          </ListItem>
        ))}
      {!isLoading &&
        Object.keys(users).map(key => {
          const labelId = `checkbox-list-secondary-label-${key}`
          return (
            <ListItem
              key={key}
              button={currentUser.uid !== key}
              onClick={() => (currentUser.uid !== key ? redirectToRoom(key) : null)}
            >
              <ListItemAvatar>
                {users[key].isOnline ? (
                  <AvatarLogged
                    overlap="circle"
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right'
                    }}
                    variant="dot"
                  >
                    <Avatar alt={users[key].displayName} src={users[key].photoURL} />
                  </AvatarLogged>
                ) : (
                  <Avatar alt={users[key].displayName} src={users[key].photoURL} />
                )}
              </ListItemAvatar>
              <ListItemText
                id={labelId}
                primary={
                  <Box display="flex" alignItems="center">
                    <Typography>{users[key].displayName}</Typography>
                    {currentUser.uid === key ? (
                      <Typography className={classes.you} variant="caption">
                        (you)
                      </Typography>
                    ) : null}
                  </Box>
                }
              />
            </ListItem>
          )
        })}
    </List>
  )
}

export default ListOnlines
