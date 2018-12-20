import { Action } from 'redux'
import { ofType } from 'redux-observable'
import { bindCallback, Observable, from } from 'rxjs'
import Logic from 'Logic'
import { CurrencyPair, Direction } from 'rt-types'
import { filter, map, mergeMap, withLatestFrom, tap } from 'rxjs/operators'
import { SpotTileActions, TILE_ACTION_TYPES } from '../actions'
import { SpotTileData } from '../model/spotTileData'

type ExecutedTradeAction = ReturnType<typeof SpotTileActions.tradeExecuted>
type DisplayChartAction = ReturnType<typeof SpotTileActions.displayCurrencyChart>
type Message = [Msg, string]

const CHART_ID = 'ChartIQ'
const createChartConfig = (symbol: string, interval: number): AppConfig => ({
  uuid: CHART_ID,
  url: `http://adaptiveconsulting.github.io/ReactiveTraderCloud/chartiq/chartiq-shim.html?symbol=${symbol}&period=${interval}`,
  icon: 'http://adaptiveconsulting.github.io/ReactiveTraderCloud/chartiq/icon.png',
  payload: { symbol, interval },
  topic: 'chartiq:main:change_symbol',
})

export const spotTileFinLogic: Logic = function*(action$, state$, { platform }, finEnabled) {
  if (finEnabled) {
    const interopSubscribe$: Observable<unknown> = bindCallback(platform.interop.subscribe)('*', 'close-position')

    yield interopSubscribe$.pipe(
      withLatestFrom(state$),
      map(([message, state]) => {
        const [msg, uuid] = message as Message
        const trade = createTrade(msg, state.spotTilesData[msg.symbol], state.currencyPairs[msg.symbol])
        return SpotTileActions.executeTrade(trade, {
          uuid,
          correlationId: msg.correlationId,
        })
      }),
    )

    yield action$.pipe(
      ofType<Action, ExecutedTradeAction>(TILE_ACTION_TYPES.TRADE_EXECUTED),
      filter((action: ExecutedTradeAction) => typeof action.meta !== 'undefined' && action.meta !== null),
      map((action: ExecutedTradeAction) => action.meta.correlationId),
      tap(correlationId => platform.interop.publish(correlationId, null)),
    )

    yield action$.pipe(
      ofType<Action, DisplayChartAction>(TILE_ACTION_TYPES.DISPLAY_CURRENCY_CHART),
      mergeMap<DisplayChartAction, string>((action: DisplayChartAction) =>
        from(platform.app!.open!(CHART_ID, createChartConfig(action.payload, 5))),
      ),
      map(SpotTileActions.currencyChartOpened),
    )
  }
}

export function createTrade(msg: Msg, priceData: SpotTileData, currencyPair: CurrencyPair) {
  const direction = msg.amount > 0 ? Direction.Sell : Direction.Buy
  const notional = Math.abs(msg.amount)

  const spotRate = direction === Direction.Buy ? priceData.price.ask : priceData.price.bid

  return {
    CurrencyPair: priceData.price.symbol,
    SpotRate: spotRate,
    Direction: direction,
    Notional: notional,
    DealtCurrency: currencyPair.base,
  }
}

interface AppConfig {
  url?: string
  icon?: string
  uuid?: string
  payload?: string | object
  topic?: string
}

interface Msg {
  amount: number
  ccy: string
  symbol: string
  correlationId: string
}
