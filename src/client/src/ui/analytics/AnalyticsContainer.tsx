import React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { Loadable } from 'rt-components'
import { Environment } from 'rt-system'
import { GlobalState } from 'StoreTypes'
import { AnalyticsActions } from './actions'
import Analytics from './components'
interface AnalyticsContainerOwnProps {
  onPopoutClick?: () => void
  tornOff?: boolean
  tearable?: boolean
}

type AnalyticsContainerStateProps = ReturnType<typeof mapStateToProps>
type AnalyticsContainerDispatchProps = ReturnType<typeof mapDispatchToProps>
type AnalyticsContainerProps = AnalyticsContainerStateProps &
  AnalyticsContainerDispatchProps &
  AnalyticsContainerOwnProps

const AnalyticsContainer: React.SFC<AnalyticsContainerProps> = ({
  status,
  onMount,
  tearable = false,
  tornOff,
  ...props
}) => (
  <Loadable
    minWidth={22}
    onMount={onMount}
    status={status}
    render={() => <Analytics {...props} canPopout={tearable && !Environment.isRunningInIE() && !tornOff} />}
    message="Analytics Disconnected"
  />
)

const mapStateToProps = (state: GlobalState) => ({
  analyticsLineChartModel: state.analyticsService.chartModel,
  positionsChartModel: state.analyticsService.positionsModel,
  status: state.analyticsService.status,
  currencyPairs: state.analyticsService.currencyPairs,
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onMount: () => dispatch(AnalyticsActions.subcribeToAnalytics()),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AnalyticsContainer)
