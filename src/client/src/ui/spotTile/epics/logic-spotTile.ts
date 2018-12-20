import { Action } from 'redux'
import { ofType } from 'redux-observable'
import Logic from 'Logic'
import { delay, map, mergeMap } from 'rxjs/operators'
import { SpotTileActions, TILE_ACTION_TYPES } from '../actions'
import { ExecuteTradeRequest, ExecuteTradeResponse } from '../model/executeTradeRequest'
import ExecutionService from '../executionService'

type ExecutionAction = ReturnType<typeof SpotTileActions.executeTrade>
type ExecutedTradeAction = ReturnType<typeof SpotTileActions.tradeExecuted>

const DISMISS_NOTIFICATION_AFTER_X_IN_MS = 6000

export const spotTileLogic: Logic = function*(action$, state$, { loadBalancedServiceStub, limitChecker }) {
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
