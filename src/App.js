import React, { useContext, useEffect, useState } from 'react'
import { HashRouter as Router, Redirect, Route, useHistory } from 'react-router-dom'
import { Box, CircularProgress } from '@material-ui/core'
import CssBaseline from '@material-ui/core/CssBaseline'
import { ThemeProvider } from '@material-ui/core/styles'
import { SnackbarProvider } from 'notistack'

import ErrorBoundary from './components/ErrorBoundary'
import Rooms from './containers/Rooms'
import SignIn from './containers/SignIn'
import SignUp from './containers/SignUp'
import { auth } from './services/firebase'
import { SocketContext } from './stores/SocketContext'
import theme from './theme'

function PrivateRoute({ component: Component, isLogged, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        isLogged === true ? <Component {...props} /> : <Redirect to={{ pathname: '/sign-in', state: { from: props.location } }} />
      }
    />
  )
}

function PublicRoute({ component: Component, isLogged, ...rest }) {
  return <Route {...rest} render={props => (isLogged === false ? <Component {...props} /> : <Redirect to="/rooms" />)} />
}

function App() {
  const history = useHistory()
  const [isLoading, setIsLoading] = useState(true)
  const [state, dispatch] = useContext(SocketContext)

  useEffect(() => {
    const init = async () => {
      try {
        await auth().setPersistence('none')
        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
      }
    }

    init()
  }, [dispatch, history])

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider>
        <ErrorBoundary>
          <CssBaseline />
          {isLoading ? (
            <Box height="100vh" width="100vw" display="flex" justifyContent="center" alignItems="center">
              <CircularProgress />
            </Box>
          ) : (
            <Router>
              <PublicRoute isLogged={!!state.currentUser} path="/sign-up" exact component={SignUp} />
              <PublicRoute isLogged={!!state.currentUser} path="/sign-in" exact component={SignIn} />
              <PrivateRoute isLogged={!!state.currentUser} path="/rooms" exact component={Rooms} />
              <Route path="/" exact>
                <Redirect to="/rooms" />
              </Route>
            </Router>
          )}
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default App
