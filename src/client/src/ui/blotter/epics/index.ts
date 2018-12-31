import { combineLogicsIntoEpic } from 'Logic'
import { enabledLogic, businessLogic } from '../../../rt-logic/blotter'

export default combineLogicsIntoEpic(enabledLogic, businessLogic)
