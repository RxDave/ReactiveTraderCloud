import { TILE_ACTION_TYPES } from './actions'
import { SpotTileData } from './model/spotTileData'
import createConnectedReducer from 'commonReducers'

export interface SpotTileState {
  [currencyPair: string]: SpotTileData
}

export default createConnectedReducer(TILE_ACTION_TYPES.TRADE_UPDATED, {})
