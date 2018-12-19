import { action, ActionUnion } from 'rt-util'
import { AnalyticsState } from './reducer'

export enum ANALYTICS_ACTION_TYPES {
  ANALYTICS_SERVICE = '@ReactiveTraderCloud/ANALYTICS_SERVICE',
  SUBCRIBE_TO_ANALYTICS = '@ReactiveTraderCloud/SUBSRCIBE_TO_ANALYTICS',
}

export const AnalyticsActions = {
  refreshAnalyticsUI: action<ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE, AnalyticsState>(
    ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE,
  ),
  subcribeToAnalytics: action(ANALYTICS_ACTION_TYPES.SUBCRIBE_TO_ANALYTICS),
}

export type AnalyticsActions = ActionUnion<typeof AnalyticsActions>
