import {Rx} from '@cycle/core';
import {h} from '@cycle/dom';

// MVI internal approach

function intent(DOM, name = '') {
  return {
    increment$: DOM.select(`.counter${name} .increment`).events('click')
      .map(() => (1))
  };
}

function model(props$, actions) {
  let sanitizedProps$ = props$.startWith({value: 0});
  return sanitizedProps$.map(({value}) => value).merge(actions.increment$).scan((x, y) => x + y).map(value => ({value}))
}

function view(state$, name = '') {
  return state$.map(({value}) => {
    return h(`div.counter${name}`, [
      h('button.increment', ['increment']),
      h('label', value + '')
    ]);
  });
}

function counter({DOM, props$}, name = '') {
  let actions = intent(DOM, name);
  let state$ = model(props$, actions);
  let vtree$ = view(state$, name);
  return {
    DOM: vtree$,
    state$: state$,
  };
}

export default counter;
