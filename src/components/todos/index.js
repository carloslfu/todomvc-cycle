import {Rx} from '@cycle/core';
import {createActions, createInitialState} from './actions';
import createReducers from './reducers';
import createState from './state';
import createResponses from './responses';
import todoItem from '../todo-item';
import mapValues from 'lodash.mapvalues';

function amendStateWithChildren(DOM) {
  return function (todosData) {
    return {
      list: todosData.list.map(data => {
        const props$ = Rx.Observable.just(data);
        const name = `.item${data.id}`;
        const scopedDOM = DOM.select(name).observable; // scoped helper, TODO: allow infinite chaining
        scopedDOM.select = selector => {
          return {
            events: event => scopedDOM
              .filter(elements => !!elements[0])
              .map(elements => elements[0].querySelector(selector))
              .flatMap(els => Rx.Observable.fromEvent(els, event)),
          }
        }
        return {
          id: data.id,
          title: data.title,
          completed: data.completed,
          todoItem: todoItem({DOM: scopedDOM, props$}, name) // scoped selector
        };
      }),
      filter: todosData.filter,
      filterFn: todosData.filterFn,
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
