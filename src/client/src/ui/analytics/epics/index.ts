import { combineLogicsIntoEpic } from 'Logic'
import { enabledLogic, businessLogic } from '../../../rt-logic/analytics'

export default combineLogicsIntoEpic(enabledLogic, businessLogic)
