import Logic from 'Logic'
import { spotTileLogic } from './logic-spotTile'
import { spotTileFinLogic } from './logic-spotTile-fin'
import { pricingLogic } from './logic-pricing'

export const enabledLogic: Logic = function() {
  // TODO: The call to subscribe happens onMount, but it also carries data that the tile and pricing logic both require.
  // Consider using different actions for mounting / subscribing.
  //
  // return action$.pipe(ofType<Action, SubscribeToSpotTileAction>(TILE_ACTION_TYPES.SPOT_TILE_SUBSCRIBE));
  return null
}

export const businessLogic: Logic = function*(...props) {
  yield* spotTileLogic(...props)
  yield* spotTileFinLogic(...props)
  yield* pricingLogic(...props)
}
