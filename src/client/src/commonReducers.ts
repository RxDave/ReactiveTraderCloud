import { CONNECTION_ACTION_TYPES, DisconnectAction } from 'rt-actions'
import { ActionWithPayload } from 'rt-util'

export default function createConnectedReducer<TUpdateAction extends string, TState>(
  updateActionType: TUpdateAction,
  initialAndDisconnectedState: TState,
) {
  return <TAction extends ActionWithPayload<TUpdateAction, TState>>(
    state: TState = initialAndDisconnectedState,
    action: TAction | DisconnectAction,
  ): TState => {
    switch (action.type) {
      case updateActionType:
        return (action as TAction).payload
      case CONNECTION_ACTION_TYPES.DISCONNECT_SERVICES:
        return initialAndDisconnectedState
      default:
        return state
    }
  }
}
