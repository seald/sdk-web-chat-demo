import React from 'react'
import { Box } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import AlertTitle from '@material-ui/lab/AlertTitle'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error(errorInfo)
  }

  render() {
    return this.state.hasError ? (
      <Box height="100vh" width="100vw" display="flex" justifyContent="center" alignItems="center">
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>A fatal error has occurred — <strong>check it out!</strong>
        </Alert>
      </Box>
    ) : (
      this.props.children
    )
  }
}

export default ErrorBoundary
