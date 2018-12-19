import { combineLogicsIntoEpic } from 'Logic'
import { enabledLogic, businessLogic } from './logic'

export default combineLogicsIntoEpic(enabledLogic, businessLogic)
