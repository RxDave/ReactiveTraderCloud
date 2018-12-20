import { createSelector } from 'reselect'
import { Trades, Trade } from 'rt-types'

// TODO: What is the perf of this operation? Does reselect compare every trade to every previous
// trade to determine whether any item in the collection has changed? If so, wouldn't it be faster
// to simply call reverse every time a trade update arrives?
// 1. This would avoid two iterations over the collection when the update does contain a change, which is presumably the common case.
// 2. In the cases where it doesn't contain a change, simply reversing the array would cost only 1 iteration, the same cost as
// (actually, presumably cheaper than) reselect iterating to determine that no items in the collection have changed.
export const selectBlotterRows = createSelector(
  (trades: Trades) => trades,
  trades => (Object.values(trades) as Trade[]).reverse(),
)
