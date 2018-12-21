import _ from 'lodash'
import { Action } from 'redux'
import { ofType } from 'redux-observable'
import { interval } from 'rxjs'
import { filter, map, skipWhile, tap } from 'rxjs/operators'
import Logic from 'Logic'
import { BLOTTER_ACTION_TYPES, BlotterActions } from '../actions'
import { CurrencyPair, CurrencyPairMap, Trade, Trades, TradeStatus } from 'rt-types'
import BlotterService from '../blotterService'
import moment from 'moment'
import numeral from 'numeral'

type SubscribeToBlotterAction = ReturnType<typeof BlotterActions.subscribeToBlotterAction>
type NewTradesAction = ReturnType<typeof BlotterActions.createNewTradesAction>

export const enabledLogic: Logic = function(action$) {
  return action$.pipe(ofType<Action, SubscribeToBlotterAction>(BLOTTER_ACTION_TYPES.SUBSCRIBE_TO_BLOTTER_ACTION))
}

export const businessLogic: Logic = function*(action$, state$, { loadBalancedServiceStub, platform }, finEnabled) {
  const blotterService = new BlotterService(loadBalancedServiceStub)
  yield blotterService.getTradesStream().pipe(
    map(data => {
      const trades: Trades = {
        ...state$.value.blotterService.trades,
        ..._.keyBy(data.trades, `tradeId`),
      }

      // TODO: Instead of reversing the entire array each time, find all of the data.trades by their keys and update
      // them specifically; i.e., partial-batch updates.
      return BlotterActions.createNewTradesAction({
        trades,
        rows: (Object.values(trades) as Trade[]).reverse(),
      })
    }),
  )

  if (finEnabled) {
    yield action$.pipe(
      ofType<Action, NewTradesAction>(BLOTTER_ACTION_TYPES.BLOTTER_SERVICE_NEW_TRADES),
      map(action => action.payload.trades[0]),
      skipWhile(trade => !state$.value.currencyPairs[trade.symbol]),
      filter(trade => trade.status === TradeStatus.Done || trade.status === TradeStatus.Rejected),
      map(trade => formatTradeNotification(trade, state$.value.currencyPairs[trade.symbol])),
      tap(tradeNotification => platform.notification.notify({ tradeNotification })),
    )

    yield interval(7500).pipe(
      tap(() => {
        const parsedData = parseBlotterData(state$.value.blotterService.trades, state$.value.currencyPairs)
        platform.interop.publish('blotter-data', parsedData)
      }),
    )
  }
}

function parseBlotterData(blotterData: Trades, currencyPairs: CurrencyPairMap) {
  if (Object.keys(currencyPairs).length === 0 || Object.keys(blotterData).length === 0) {
    return []
  }
  return Object.keys(blotterData).map(x =>
    formatTradeNotification(blotterData[x], currencyPairs[blotterData[x].symbol]),
  )
}

const formatTradeNotification = (trade: Trade, currencyPair: CurrencyPair) => ({
  symbol: trade.symbol,
  spotRate: trade.spotRate,
  notional: numeral(trade.notional).format('0,000,000[.]00'),
  direction: trade.direction,
  tradeId: trade.tradeId.toString(),
  tradeDate: moment(trade.tradeDate).format(),
  status: trade.status,
  dealtCurrency: trade.dealtCurrency,
  termsCurrency: currencyPair.terms,
  valueDate: moment.utc(trade.valueDate).format('DD MMM'),
  traderName: trade.traderName,
})
