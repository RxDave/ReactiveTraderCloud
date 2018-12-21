import { Action } from 'redux'
import { ofType, ActionsObservable, StateObservable } from 'redux-observable'
import { Observable, OperatorFunction } from 'rxjs'
import { delay, map, mergeMap } from 'rxjs/operators'
import { ActionWithPayload } from 'rt-util'
import Logic from 'Logic'
import { GlobalState } from 'StoreTypes'
import { SpotTileActions, TILE_ACTION_TYPES } from '../actions'
import { SpotTileData } from '../model'
import { ExecuteTradeRequest, ExecuteTradeResponse } from '../model/executeTradeRequest'
import { PriceMovementTypes } from '../model/priceMovementTypes'
import ExecutionService from '../executionService'

type SubscribeToSpotTileAction = ReturnType<typeof SpotTileActions.subscribeToSpotTile>
type DisplayCurrencyChartAction = ReturnType<typeof SpotTileActions.displayCurrencyChart>
type CurrencyChartOpenedAction = ReturnType<typeof SpotTileActions.currencyChartOpened>
type ExecutionAction = ReturnType<typeof SpotTileActions.executeTrade>
type ExecutedTradeAction = ReturnType<typeof SpotTileActions.tradeExecuted>
type DismissNotificationAction = ReturnType<typeof SpotTileActions.dismissNotification>

const DISMISS_NOTIFICATION_AFTER_X_IN_MS = 6000

export const spotTileLogic: Logic = function*(action$, state$, { loadBalancedServiceStub, limitChecker }) {
  const updateTradeDataOn = createUpdateTradeDataOn(action$, state$)

  yield action$.pipe(
    ofType<Action, SubscribeToSpotTileAction>(TILE_ACTION_TYPES.SPOT_TILE_SUBSCRIBE),
    map(action =>
      SpotTileActions.update({
        ...state$.value.spotTilesData,
        [action.payload]: {
          isTradeExecutionInFlight: false,
          currencyChartIsOpening: false,
          lastTradeExecutionStatus: null,
          price: {
            ask: 0,
            bid: 0,
            mid: 0,
            creationTimestamp: 0,
            symbol: '',
            valueDate: '',
            priceMovementType: PriceMovementTypes.None,
            priceStale: false,
          },
        },
      }),
    ),
  )

  yield updateTradeDataOn<DisplayCurrencyChartAction, string>(TILE_ACTION_TYPES.DISPLAY_CURRENCY_CHART, {
    currencyChartIsOpening: true,
  })
  yield updateTradeDataOn<CurrencyChartOpenedAction, string>(TILE_ACTION_TYPES.CURRENCY_CHART_OPENED, {
    currencyChartIsOpening: false,
  })
  yield updateTradeDataOn<DismissNotificationAction, string>(TILE_ACTION_TYPES.DISMISS_NOTIFICATION, {
    lastTradeExecutionStatus: null,
  })
  yield updateTradeDataOn<ExecutionAction, ExecuteTradeRequest>(
    TILE_ACTION_TYPES.EXECUTE_TRADE,
    { isTradeExecutionInFlight: true },
    payload => payload.CurrencyPair,
  )
  yield updateTradeDataOn<ExecutedTradeAction, ExecuteTradeResponse>(
    TILE_ACTION_TYPES.TRADE_EXECUTED,
    payload => ({ isTradeExecutionInFlight: false, lastTradeExecutionStatus: payload }),
    payload => payload.request.CurrencyPair,
  )

  const limitCheck = (executeTradeRequest: ExecuteTradeRequest) =>
    limitChecker.rpc({
      tradedCurrencyPair: executeTradeRequest.CurrencyPair,
      notional: executeTradeRequest.Notional,
      rate: executeTradeRequest.SpotRate,
    })

  const executionService = new ExecutionService(loadBalancedServiceStub, limitCheck)

  yield action$.pipe(
    ofType<Action, ExecutionAction>(TILE_ACTION_TYPES.EXECUTE_TRADE),
    mergeMap((request: ExecutionAction) =>
      executionService
        .executeTrade(request.payload)
        .pipe(map((result: ExecuteTradeResponse) => SpotTileActions.tradeExecuted(result, request.meta))),
    ),
  )

  yield action$.pipe(
    ofType<Action, ExecutedTradeAction>(TILE_ACTION_TYPES.TRADE_EXECUTED),
    delay(DISMISS_NOTIFICATION_AFTER_X_IN_MS),
    map((action: ExecutedTradeAction) => action.payload.request.CurrencyPair),
    map(SpotTileActions.dismissNotification),
  )
}

export const createUpdateTradeDataOn = (
  action$: ActionsObservable<Action<any>>,
  state$: StateObservable<GlobalState>,
) => <TAction extends ActionWithPayload<string, TPayload>, TPayload>(
  actionType: string,
  data: Partial<SpotTileData> | ((payload: TPayload) => Partial<SpotTileData>),
  idSelector?: (payload: TPayload) => string,
  filter?: OperatorFunction<TAction, TAction>,
): Observable<Action<any>> => {
  const operators: Array<OperatorFunction<any, any>> = [ofType<Action, TAction>(actionType)]
  //if (filter) { operators.push(filter); }
  operators.push(
    map(action => {
      const key = typeof action.payload === 'string' ? action.payload : idSelector(action.payload)
      return SpotTileActions.update({
        ...state$.value.spotTilesData,
        [key]: {
          ...state$.value.spotTilesData[key],
          ...(typeof data === 'function' ? data(action.payload) : data),
        },
      })
    }),
  )

  return action$.pipe(...operators)
}
