import { Action } from 'redux'
import { ofType } from 'redux-observable'
import Logic from 'Logic'
import { map, mergeMap, tap } from 'rxjs/operators'
import { CurrencyPairMap } from 'rt-types'
import { SpotTileActions, TILE_ACTION_TYPES } from '../ui/spotTile/actions'
import { SpotPriceTick } from '../ui/spotTile/model/spotPriceTick'
import PricingService from '../ui/spotTile/pricingService'
import { createUpdateTradeDataOn } from './spotTile-core'

type SubscribeToSpotTileAction = ReturnType<typeof SpotTileActions.subscribeToSpotTile>
type PriceUpdateAction = ReturnType<typeof SpotTileActions.priceUpdateAction>

export const pricingLogic: Logic = function*(
  action$,
  state$,
  { loadBalancedServiceStub, referenceDataService, platform },
  finEnabled,
) {
  const updateTradeDataOn = createUpdateTradeDataOn(action$, state$)

  yield updateTradeDataOn<PriceUpdateAction, SpotPriceTick>(
    TILE_ACTION_TYPES.SPOT_PRICES_UPDATE,
    payload => ({ price: payload }),
    payload => payload.symbol,
    payload => state$.value.spotTilesData[payload.symbol] !== 'undefined',
  )

  const pricingService = new PricingService(loadBalancedServiceStub)

  yield action$.pipe(
    ofType<Action, SubscribeToSpotTileAction>(TILE_ACTION_TYPES.SPOT_TILE_SUBSCRIBE),
    mergeMap((action: SubscribeToSpotTileAction) =>
      pricingService.getSpotPriceStream({ symbol: action.payload }).pipe(map(SpotTileActions.priceUpdateAction)),
    ),
  )

  if (finEnabled) {
    yield action$.pipe(
      ofType<Action, PriceUpdateAction>(TILE_ACTION_TYPES.SPOT_PRICES_UPDATE),
      mergeMap(action =>
        referenceDataService.getCurrencyPairUpdates$().pipe(
          map(currencyMap => addRatePrecisionToPrice(currencyMap, action.payload)),
          tap(enhancedPrice => platform.interop.publish('price-update', enhancedPrice)),
        ),
      ),
    )
  }
}

const addRatePrecisionToPrice = (currencyData: CurrencyPairMap, price: SpotPriceTick) => ({
  ...price,
  ratePrecision: currencyData[price.symbol].ratePrecision,
})
