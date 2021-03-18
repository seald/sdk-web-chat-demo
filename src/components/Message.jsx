import React, { memo, useEffect } from 'react'
import { Box, CircularProgress, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useImmer } from 'use-immer'

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: props => {
      if (props.isError) {
        return theme.palette.error.main
      } else if (props.isLoading) {
        return theme.palette.grey[300]
      } else if (props.isCurrentUser) {
        return theme.palette.primary.main
      } else {
        return theme.palette.grey[600]
      }
    },
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1.1),
    borderRadius: '1.3em',
    borderBottomRightRadius: props => (props.isCurrentUser ? 0 : '1.3em'),
    borderBottomLeftRadius: props => (props.isCurrentUser ? '1.3em' : 0),
    maxWidth: 250,
    transition: 'background-color 0.3s',
    minWidth: 10,
    wordBreak: 'break-word'
  }
}))

function Message({ value, isCurrentUser }) {
  const [state, setState] = useImmer({
    isLoading: typeof value !== 'string',
    isError: false,
    val: typeof value !== 'string' ? undefined : value
  })
  const classes = useStyles({ isCurrentUser, isError: state.isError, isLoading: state.isLoading })

  useEffect(() => {
    let hasCancelled = false
    ;(async () => {
      try {
        const val = await value
        if (!hasCancelled) {
          setState(draft => {
            draft.val = val
            draft.isLoading = false
          })
        }
      } catch (error) {
        console.error(error)
        setState(draft => {
          draft.isLoading = false
          draft.isError = true
        })
      }
    })()

    return () => {
      hasCancelled = true
    }
  }, [value, setState])

  return (
    <Box className={classes.root}>
      {state.isLoading ? (
        <CircularProgress
          color="secondary"
          size={18}
          style={{
            color: 'white'
          }}
        />
      ) : (
        <Typography color="inherit" variant="body2">
          {state.isError ? 'An error occured' : state.val}
        </Typography>
      )}
    </Box>
  )
}

export default memo(Message)
