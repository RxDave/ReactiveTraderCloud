import { ServiceConnectionStatus } from 'rt-types'
import { ANALYTICS_ACTION_TYPES } from './actions'
import { CurrencyPairState } from 'shell'
import { CurrencyPairPosition, HistoricPosition, PNLChartModel, PositionsChartModel } from './model'
import { getPnlChartModel } from './model/pnlChartModel'
import { getPositionsChartModel } from './model/positionsChartModel'
import createConnectedReducer from 'commonReducers'

export interface AnalyticsState {
  currentPositions: CurrencyPairPosition[]
  history: HistoricPosition[]
  chartModel: PNLChartModel
  positionsModel: PositionsChartModel
  status: ServiceConnectionStatus
  currencyPairs: CurrencyPairState
}

export default createConnectedReducer(ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE, {
  currentPositions: [],
  history: [],
  chartModel: getPnlChartModel([]),
  positionsModel: getPositionsChartModel([]),
  status: ServiceConnectionStatus.DISCONNECTED,
  currencyPairs: {},
})
