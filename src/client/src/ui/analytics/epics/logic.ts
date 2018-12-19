import { Action } from 'redux'
import { ofType } from 'redux-observable'
import { map, tap } from 'rxjs/operators'
import Logic from 'Logic'
import { REF_ACTION_TYPES, ReferenceActions } from 'rt-actions'
import { ANALYTICS_ACTION_TYPES, AnalyticsActions } from '../actions'
import { CurrencyPairPosition } from '../model/currencyPairPosition'
import AnalyticsService from '../analyticsService'

const CURRENCY: string = 'USD'

const { fetchAnalytics, subcribeToAnalytics } = AnalyticsActions
type SubscribeToAnalyticsAction = ReturnType<typeof subcribeToAnalytics>
type FetchAnalyticsAction = ReturnType<typeof fetchAnalytics>

const { createReferenceServiceAction } = ReferenceActions
type ReferenceServiceAction = ReturnType<typeof createReferenceServiceAction>

export const enabledLogic: Logic = function*(action$) {
  yield action$.pipe(ofType<Action, SubscribeToAnalyticsAction>(ANALYTICS_ACTION_TYPES.SUBCRIBE_TO_ANALYTICS))
  yield action$.pipe(ofType<Action, ReferenceServiceAction>(REF_ACTION_TYPES.REFERENCE_SERVICE))
}

export const businessLogic: Logic = function*(action$, state$, { loadBalancedServiceStub, platform }, finEnabled) {
  const analyticsService = new AnalyticsService(loadBalancedServiceStub)
  yield analyticsService.getAnalyticsStream(CURRENCY).pipe(map(fetchAnalytics))

  if (finEnabled) {
    yield action$.pipe(
      ofType<Action, FetchAnalyticsAction>(ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE),
      map(action => action.payload.currentPositions.map(mapToDto)),
      tap(currentPositions => platform.interop!.publish('position-update', currentPositions)),
    )
  }
}

const mapToDto = (ccyPairPosition: CurrencyPairPosition) => ({
  symbol: ccyPairPosition.symbol,
  basePnl: ccyPairPosition.basePnl,
  baseTradedAmount: ccyPairPosition.baseTradedAmount,
})
