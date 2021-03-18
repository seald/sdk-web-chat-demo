import React, { useCallback, useContext, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'
import Container from '@material-ui/core/Container'
import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import Link from '@material-ui/core/Link'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import { useSnackbar } from 'notistack'

import Copyright from '../components/Copyright'
import { signUp } from '../services/firebase'
import { createSealdSDK } from '../services/seald'
import { SET_AUTH } from '../stores/reducer/constants.js'
import { SocketContext } from '../stores/SocketContext.jsx'

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  logo: {
    width: 200,
    marginBottom: 20
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1)
  },
  wrapperButton: {
    margin: theme.spacing(1),
    position: 'relative'
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  },
  buttonProgress: {
    color: theme.success,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -12
  }
}))

function SignUp() {
  const { enqueueSnackbar } = useSnackbar()
  const [isLoading, setIsLoading] = useState(false)
  const [, dispatch] = useContext(SocketContext)
  const classes = useStyles()

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()
      const formData = new FormData(e.target)
      try {
        setIsLoading(true)
        const email = formData.get('email')
        const password = formData.get('password')
        const displayName = formData.get('name')
        const currentUser = await signUp({ email, password, displayName })
        await createSealdSDK({ userId: currentUser.uid, password })
        dispatch({ type: SET_AUTH, payload: { currentUser } })
      } catch (error) {
        enqueueSnackbar(error.message, {
          variant: 'error'
        })
        setIsLoading(false)
      }
    },
    [enqueueSnackbar, dispatch]
  )

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <img src={process.env.PUBLIC_URL + '/images/logo.png'} alt="Logo Seald" className={classes.logo} />
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <form className={classes.form} onSubmit={handleSubmit}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            id="password"
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="name"
            label="Display name"
            type="text"
            id="name"
            autoComplete="username"
          />
          <div className={classes.wrapperButton}>
            <Button type="submit" disabled={isLoading} fullWidth variant="contained" color="primary" className={classes.submit}>
              Sign up
            </Button>
            {isLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
          </div>
          <Grid container>
            <Grid item>
              <Link component={RouterLink} to="/sign-in" variant="body2">
                {'Already have an account? Sign In'}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      <Box mt={8}>
        <Copyright />
      </Box>
    </Container>
  )
}

export default SignUp
