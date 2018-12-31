import { ServiceConnectionStatus } from 'rt-types'
import { ANALYTICS_ACTION_TYPES } from './actions'
import { CurrencyPairState } from 'shell'
import { CurrencyPairPosition, HistoricPosition, AnalyticsLineChartModel, PositionsChartModel } from './model'
import { getModel } from './model/AnalyticsLineChartModel'
import { getPositionsChartModel } from './model/positionsChartModel'
import createConnectedReducer from 'commonReducers'

export interface AnalyticsState {
  currentPositions: CurrencyPairPosition[]
  history: HistoricPosition[]
  chartModel: AnalyticsLineChartModel
  positionsModel: PositionsChartModel
  status: ServiceConnectionStatus
  currencyPairs: CurrencyPairState
}

export default createConnectedReducer(ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE, {
  currentPositions: [],
  history: [],
  chartModel: getModel([]),
  positionsModel: getPositionsChartModel([]),
  status: ServiceConnectionStatus.DISCONNECTED,
  currencyPairs: {},
})
