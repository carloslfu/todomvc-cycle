import {Rx} from '@cycle/core';
import {createActions, createInitialState} from './actions';
import createReducers from './reducers';
import createState from './state';
import createResponses from './responses';
import todoItem from '../todo-item';
import mapValues from 'lodash.mapvalues';
import counter from '../counter';

// Dinamic composition

function amendStateWithChildren(DOM) {
  return function (todosData) {
    return {
      list: todosData.list.map(data => {
        const props$ = Rx.Observable.just(data);
        const name = `.item${data.id}`;
        return {
          id: data.id,
          title: data.title,
          completed: data.completed,
          // dinamic composition
          todoItem: todoItem({DOM: DOM.select(name), props$}, name) // scoped selector
        };
      }),
      filter: todosData.filter,
      filterFn: todosData.filterFn,
      // static composition, TODO: scope this children
      children: counter({DOM, props$: Rx.Observable.just({value: 5})}, 'countertodo'),
    };
  };
}

function makeItemActions(typeItemActions, amendedState$) {
  return mapValues(typeItemActions, (irrelevant, actionKey) =>
    amendedState$
      .filter(todosData => todosData.list.length)
      .flatMapLatest(todosData =>
        Rx.Observable.merge(todosData.list.map(i => i.todoItem[actionKey]))
      )
  );
}

function replicateAll(objectStructure, realStreams, proxyStreams) {
  mapValues(objectStructure, (irrelevant, key) => {
    realStreams[key].subscribe(proxyStreams[key].asObserver());
  });
}

function todos({DOM, hashchange, initialHash, localStorageSource}) {
  let typeItemActions = {toggle$: null, edit$: null, delete$: null};
  let proxyItemActions = mapValues(typeItemActions, () => new Rx.Subject());
  let initialState$ = createInitialState(localStorageSource);
  let actions = createActions(DOM, hashchange, initialHash, proxyItemActions);
  let reducers$ = createReducers(actions);
  let state$ = createState(reducers$, initialState$).shareReplay(1);
  let amendedState$ = state$.map(amendStateWithChildren(DOM)).shareReplay(1);
  let itemActions = makeItemActions(typeItemActions, amendedState$);
  replicateAll(typeItemActions, itemActions, proxyItemActions);
  return createResponses(state$, amendedState$)
}

export default todos;
