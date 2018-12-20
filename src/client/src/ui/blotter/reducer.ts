import _ from 'lodash'
import { Trade } from 'rt-types'
import { BLOTTER_ACTION_TYPES } from './actions'
import createConnectedReducer from 'commonReducers'

export interface Trades {
  [tradeId: number]: Trade
}

export interface BlotterState {
  trades: Trades
  rows: Trade[]
}

export default createConnectedReducer(BLOTTER_ACTION_TYPES.BLOTTER_SERVICE_NEW_TRADES, {
  trades: {},
  rows: [],
})
