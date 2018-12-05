import { action, ActionUnion } from 'rt-util'
import { PositionUpdates } from './model/positionUpdates'

export enum ANALYTICS_ACTION_TYPES {
  ANALYTICS_SERVICE = '@ReactiveTraderCloud/ANALYTICS_SERVICE',
  SUBCRIBE_TO_ANALYTICS = '@ReactiveTraderCloud/SUBSRCIBE_TO_ANALYTICS',
  FORM_BUBBLE_CHART = '@ReactiveTraderCloud/FORM_BUBBLE_CHART',
}

export const AnalyticsActions = {
  fetchAnalytics: action<ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE, PositionUpdates>(
    ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE,
  ),
  subcribeToAnalytics: action(ANALYTICS_ACTION_TYPES.SUBCRIBE_TO_ANALYTICS),
  bubbleChart: action<ANALYTICS_ACTION_TYPES.FORM_BUBBLE_CHART, any>(ANALYTICS_ACTION_TYPES.FORM_BUBBLE_CHART),
}

export type AnalyticsActions = ActionUnion<typeof AnalyticsActions>
