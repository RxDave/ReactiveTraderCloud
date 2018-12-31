import { combineLogicsIntoEpic } from 'Logic'
import { enabledLogic, businessLogic } from '../../../rt-logic/spotTile'

export default combineLogicsIntoEpic(enabledLogic, businessLogic)
