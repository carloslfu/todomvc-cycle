import {Rx} from '@cycle/core';
import {ENTER_KEY, ESC_KEY} from '../../utils';

function createActions(DOM, hashchange, initialHash, itemActions) {
  const getTodoItemId = (name) => parseInt(name.replace('.item', ''))

  return {
    changeRoute$: Rx.Observable.concat(
      initialHash.map(hash => hash.replace('#', '')),
      hashchange.map(ev => ev.newURL.match(/\#[^\#]*$/)[0].replace('#', ''))
    ),

    clearInput$: DOM.select('.new-todo').events('keydown')
      .filter(ev => ev.keyCode === ESC_KEY),

    insertTodo$: DOM.select('.new-todo').events('keydown')
      .filter(ev => {
        let trimmedVal = String(ev.target.value).trim();
        return ev.keyCode === ENTER_KEY && trimmedVal;
      })
      .map(ev => String(ev.target.value).trim()),

    toggleTodo$: itemActions.toggle$
      .map(({name}) => name).map(getTodoItemId),

    deleteTodo$: itemActions.delete$
      .map(({name}) => name).map(getTodoItemId),

    editTodo$: itemActions.edit$
      .map(({name, title}) => ({id: getTodoItemId(name), title})),

    toggleAll$: DOM.select('.toggle-all').events('click'),

    deleteCompleteds$: DOM.select('.clear-completed').events('click')
  };
}

const safeJSONParse = str => JSON.parse(str) || {};

const mergeWithDefaultTodosData = todosData => {
  let defaultTodosData = {
    list: [],
    filter: '',
    filterFn: () => true // allow anything
  };
  return merge(defaultTodosData, todosData);
}

function deserialize(localStorageValue$) {
  return localStorageValue$
    .map(safeJSONParse)
    .map(mergeWithDefaultTodosData);
}


function createInitialState(localStorageSource) {
  return deserialize(localStorageSource)
}

function merge() {
  let result = {};
  for (let i = 0; i < arguments.length; i++) {
    let object = arguments[i];
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        result[key] = object[key];
      }
    }
  }
  return result;
}

export default {
  createInitialState,
  createActions
};
