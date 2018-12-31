import { createSelector } from 'reselect'
import { GlobalState } from 'StoreTypes'
import { SpotTileContainerOwnProps } from './SpotTileContainer'

const getCurrencyPair = (state: GlobalState, props: SpotTileContainerOwnProps) => state.currencyPairs[props.id]
const selectCurrencyPair = createSelector([getCurrencyPair], currencyPair => currencyPair)

const getSpotTileData = (state: GlobalState, props: SpotTileContainerOwnProps) => state.spotTilesData[props.id]
const selectSpotTileData = createSelector([getSpotTileData], spotTileData => spotTileData)

export { selectCurrencyPair, selectSpotTileData }
