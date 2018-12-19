import { createSelector } from 'reselect'
import { getPnlChartModel } from './model/pnlChartModel'
import { getPositionsChartModel } from './model/positionsChartModel'
import { PositionUpdates } from './model/index'

const selectPositionsChartModel = createSelector(
  [(updates: PositionUpdates) => updates.currentPositions],
  currentPositions => getPositionsChartModel(currentPositions),
)

const selectPnlChartModel = createSelector([(updates: PositionUpdates) => updates.history], history =>
  getPnlChartModel(history),
)

export { selectPositionsChartModel, selectPnlChartModel }
