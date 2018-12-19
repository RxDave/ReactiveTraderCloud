import { Observable, EMPTY, merge } from 'rxjs'
import { switchMap, map, combineLatest, distinctUntilChanged, filter } from 'rxjs/operators'
import { Action } from 'redux'
import { ActionsObservable, StateObservable } from 'redux-observable'
import { ApplicationEpic, GlobalState } from 'StoreTypes'
import { applicationConnected, applicationDisconnected } from 'rt-actions'
import { ApplicationDependencies } from './applicationServices'

type Logic = (
  action$: ActionsObservable<Action>,
  state$: StateObservable<GlobalState>,
  dependencies: ApplicationDependencies,
  finEnabled: boolean,
) => IterableIterator<Observable<Action>> | IterableIterator<Observable<any>> | Observable<Action> | Observable<any>
export default Logic

export function combineLogicsIntoEpic(enabledLogic: Logic, ...logics: Logic[]): ApplicationEpic {
  return (
    action$: ActionsObservable<Action>,
    state$: StateObservable<GlobalState>,
    dependencies: ApplicationDependencies,
  ) => {
    const finEnabled = typeof fin !== 'undefined'

    const outputs: Array<Observable<any>> = []
    for (const logic of logics) {
      pushObservables(outputs, logic(action$, state$, dependencies, finEnabled), suppressNonActions)
    }
    const logicActions = merge(...outputs)

    const enableds: Array<Observable<boolean>> = []
    pushObservables(enableds, enabledLogic(action$, state$, dependencies, finEnabled), toBooleans)

    const connections = merge(
      action$.pipe(
        applicationConnected,
        map(_ => true),
      ),
      action$.pipe(
        applicationDisconnected,
        map(_ => false),
      ),
    )

    return connections.pipe(
      combineLatest<boolean, boolean, boolean>(
        enableds,
        (serviceAvailable, ...logicEnableds) => serviceAvailable && logicEnableds.every(b => b),
      ),
      distinctUntilChanged(),
      switchMap(ready => (ready ? logicActions : EMPTY)),
    )
  }
}

function suppressNonActions<T>(observable: Observable<T>): Observable<T> {
  // This filter is semantically equiv to: "notification instanceof Action", but that doesn't work in TypeScript because Action is an interface.
  return observable.pipe(filter(notification => 'type' in notification))
}

function toBooleans<T>(observable: Observable<T>): Observable<boolean> {
  return observable.pipe(map(notification => (typeof notification === 'boolean' ? notification as boolean : true)))
}

function pushObservables<T>(
  collection: Array<Observable<T>>,
  oneOrMoreObservables:
    | Observable<any>
    | Observable<Action<any>>
    | IterableIterator<Observable<Action<any>>>
    | IterableIterator<Observable<any>>,
  transform: Function,
) {
  if (oneOrMoreObservables instanceof Observable) {
    collection.push(transform(oneOrMoreObservables))
  } else {
    for (const observable of oneOrMoreObservables) {
      collection.push(transform(observable))
    }
  }
}
