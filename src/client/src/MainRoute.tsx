import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { timer } from 'rxjs'

import { ConnectionActions } from 'rt-actions'
import { Environment } from 'rt-components'
import { AutobahnConnectionProxy, logger } from 'rt-system'
import { ThemeState } from 'rt-theme'

import { createApplicationServices } from './applicationServices'
import { getEnvVars } from './config/config'
import configureStore from './configureStore'
import { Router } from './shell'
import FakeUserRepository from './shell/fakeUserRepository'
import { OpenFin } from './shell/openFin'

declare const window: any

const APPLICATION_DISCONNECT = 15 * 60 * 1000

const config = getEnvVars(process.env.REACT_APP_ENV!)
const log = logger.create('Application Service')

export default class MainRoute extends React.Component {
  openfin = new OpenFin()

  environment = {
    isDesktop: this.openfin.isPresent,
    openfin: this.openfin.isPresent ? this.openfin : null
  }

  store = configureStore(
    createApplicationServices({
      autobahn: new AutobahnConnectionProxy(
        (config.overwriteServerEndpoint ? config.serverEndpointUrl : location.hostname)!,
        'com.weareadaptive.reactivetrader',
        +(config.overwriteServerEndpoint ? config.serverPort : location.port)!
      ),
      openfin: this.openfin,
      user: FakeUserRepository.currentUser
    })
  )

  componentDidMount() {
    if (process.env.NODE_ENV !== 'production') {
      window.store = this.store
    }

    this.store.dispatch(ConnectionActions.connect())

    timer(APPLICATION_DISCONNECT).subscribe(() => {
      this.store.dispatch(ConnectionActions.disconnect())
      log.warn(`Application has reached disconnection time at ${APPLICATION_DISCONNECT}`)
    })
  }

  render() {
    return (
      <React.Fragment>
        <ReduxProvider store={this.store}>
          <Environment.Provider value={this.environment}>
            <LocalStorageThemeProvider>
              <Router />
            </LocalStorageThemeProvider>
          </Environment.Provider>
        </ReduxProvider>
      </React.Fragment>
    )
  }
}

class LocalStorageThemeProvider extends React.Component {
  themeName = (window.localStorage.themeName = window.localStorage.themeName || 'light')

  updateLocalStorageThemeName = (name: string) => {
    this.themeName = window.localStorage.themeName = name
  }

  render() {
    return (
      <ThemeState.Provider name={this.themeName} onChange={this.updateLocalStorageThemeName}>
        {this.props.children}
      </ThemeState.Provider>
    )
  }
}
