import { combineEpics } from 'redux-observable'
import { publishPositionUpdateEpic, formBubbleChartDataEpic } from './analyticsServiceEpic'
import { analyticsServiceEpic } from './epics'

const epics = [analyticsServiceEpic, formBubbleChartDataEpic]

if (typeof fin !== 'undefined') {
  epics.push(publishPositionUpdateEpic)
}

export default combineEpics(...epics)
