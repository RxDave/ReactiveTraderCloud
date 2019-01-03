import { Action } from 'redux'
import { ofType } from 'redux-observable'
import { map, tap } from 'rxjs/operators'
import Logic from 'Logic'
import { REF_ACTION_TYPES, ReferenceActions } from 'rt-actions'
import { ANALYTICS_ACTION_TYPES, AnalyticsActions } from '../ui/analytics/actions'
import { CurrencyPairPosition } from '../ui/analytics/model'
import { getModel } from '../ui/analytics/model/AnalyticsLineChartModel'
import { getPositionsChartModel } from '../ui/analytics/model/positionsChartModel'
import AnalyticsService from '../ui/analytics/analyticsService'

type SubscribeToAnalyticsAction = ReturnType<typeof AnalyticsActions.subcribeToAnalytics>
type FetchAnalyticsAction = ReturnType<typeof AnalyticsActions.refreshAnalyticsUI>
type ReferenceServiceAction = ReturnType<typeof ReferenceActions.createReferenceServiceAction>

const CURRENCY: string = 'USD'

export const enabledLogic: Logic = function*(action$) {
  yield action$.pipe(ofType<Action, ReferenceServiceAction>(REF_ACTION_TYPES.REFERENCE_SERVICE))
  yield action$.pipe(ofType<Action, SubscribeToAnalyticsAction>(ANALYTICS_ACTION_TYPES.SUBCRIBE_TO_ANALYTICS))
}

export const businessLogic: Logic = function*(action$, state$, { loadBalancedServiceStub, platform }, finEnabled) {
  const analyticsService = new AnalyticsService(loadBalancedServiceStub)
  yield analyticsService.getAnalyticsStream(CURRENCY).pipe(
    map(data =>
      AnalyticsActions.refreshAnalyticsUI({
        ...data,
        positionsModel: getPositionsChartModel(data.currentPositions),
        chartModel: getModel(data.history),
        status: state$.value.compositeStatusService.analytics.connectionStatus,
        currencyPairs: state$.value.currencyPairs,
      }),
    ),
  )

  if (finEnabled) {
    yield action$.pipe(
      ofType<Action, FetchAnalyticsAction>(ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE),
      map(action => action.payload.currentPositions.map(finMapToDto)),
      tap(currentPositions => platform.interop!.publish('position-update', currentPositions)),
    )
  }
}

const finMapToDto = (ccyPairPosition: CurrencyPairPosition) => ({
  symbol: ccyPairPosition.symbol,
  basePnl: ccyPairPosition.basePnl,
  baseTradedAmount: ccyPairPosition.baseTradedAmount,
})
