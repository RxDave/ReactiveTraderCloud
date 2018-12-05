import { CONNECTION_ACTION_TYPES, DisconnectAction } from 'rt-actions'
import { ANALYTICS_ACTION_TYPES, AnalyticsActions } from './actions'
import { CurrencyPairPosition, HistoricPosition, BubbleChart } from './model'

export interface AnalyticsState {
  currentPositions: CurrencyPairPosition[]
  history: HistoricPosition[]
  bubbleChart: BubbleChart[]
}

const INITIAL_STATE: AnalyticsState = {
  currentPositions: [],
  history: [],
  bubbleChart: [],
}

export const analyticsReducer = (
  state: AnalyticsState = INITIAL_STATE,
  action: AnalyticsActions | DisconnectAction,
): AnalyticsState => {
  switch (action.type) {
    case ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE:
      return { ...state, ...action.payload }
    case CONNECTION_ACTION_TYPES.DISCONNECT_SERVICES:
      return INITIAL_STATE
    case ANALYTICS_ACTION_TYPES.FORM_BUBBLE_CHART:
      return { ...state, bubbleChart: action.payload }
    default:
      return state
  }
}

export default analyticsReducer
