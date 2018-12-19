import { Action } from 'redux'
import { ofType } from 'redux-observable'
import { map, tap } from 'rxjs/operators'
import Logic from 'Logic'
import { REF_ACTION_TYPES, ReferenceActions } from 'rt-actions'
import { ANALYTICS_ACTION_TYPES, AnalyticsActions } from '../actions'
import { CurrencyPairPosition } from '../model'
import { selectPnlChartModel, selectPositionsChartModel } from '../selectors'
import AnalyticsService from '../analyticsService'

const CURRENCY: string = 'USD'

const { refreshAnalyticsUI, subcribeToAnalytics } = AnalyticsActions
type SubscribeToAnalyticsAction = ReturnType<typeof subcribeToAnalytics>
type FetchAnalyticsAction = ReturnType<typeof refreshAnalyticsUI>

const { createReferenceServiceAction } = ReferenceActions
type ReferenceServiceAction = ReturnType<typeof createReferenceServiceAction>

export const enabledLogic: Logic = function*(action$) {
  yield action$.pipe(ofType<Action, ReferenceServiceAction>(REF_ACTION_TYPES.REFERENCE_SERVICE))
  yield action$.pipe(ofType<Action, SubscribeToAnalyticsAction>(ANALYTICS_ACTION_TYPES.SUBCRIBE_TO_ANALYTICS))
}

export const businessLogic: Logic = function*(action$, state$, { loadBalancedServiceStub, platform }, finEnabled) {
  const analyticsService = new AnalyticsService(loadBalancedServiceStub)
  yield analyticsService.getAnalyticsStream(CURRENCY).pipe(
    map(data =>
      refreshAnalyticsUI({
        ...data,
        positionsModel: selectPositionsChartModel(data),
        chartModel: selectPnlChartModel(data),
        status: state$.value.compositeStatusService.analytics.connectionStatus,
        currencyPairs: state$.value.currencyPairs,
      }),
    ),
  )

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
