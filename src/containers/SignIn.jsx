import React, { useCallback, useContext, useState } from 'react'
import { Link as RouterLink, useHistory, useLocation } from 'react-router-dom'
import { CircularProgress } from '@material-ui/core'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import Link from '@material-ui/core/Link'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import { useSnackbar } from 'notistack'

import Copyright from '../components/Copyright'
import { signIn } from '../services/firebase'
import { retrieveSealdSDK } from '../services/seald'
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

function SignIn() {
  const { enqueueSnackbar } = useSnackbar()
  const [isLoading, setIsLoading] = useState(false)
  const [, dispatch] = useContext(SocketContext)
  const history = useHistory()
  const classes = useStyles()
  const location = useLocation()

  const { from } = location.state || { from: { pathname: '/rooms' } }

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()
      const formData = new FormData(e.target)
      try {
        setIsLoading(true)
        const email = formData.get('email')
        const password = formData.get('password')
        const currentUser = await signIn({ email, password })
        await retrieveSealdSDK({ userId: currentUser.uid, password })
        dispatch({ type: SET_AUTH, payload: { currentUser } })
        history.replace(from)
      } catch (error) {
        enqueueSnackbar(error.message, {
          variant: 'error'
        })
        setIsLoading(false)
      }
    },
    [history, enqueueSnackbar, from, dispatch]
  )

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <img src={process.env.PUBLIC_URL + '/images/logo.png'} alt="Logo Seald" className={classes.logo} />
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form className={classes.form} noValidate onSubmit={handleSubmit}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoFocus
            autoComplete="email"
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <div className={classes.wrapperButton}>
            <Button type="submit" disabled={isLoading} fullWidth variant="contained" color="primary" className={classes.submit}>
              Sign in
            </Button>
            {isLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
          </div>

          <Grid container>
            <Grid item>
              <Link component={RouterLink} to="/sign-up" variant="body2">
                {"Don't have an account? Sign Up"}
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

export default SignIn
