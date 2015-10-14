import {run, Rx} from '@cycle/core';
// import CycleDOM from '@cycle/dom';
import CycleDOM from './drivers/render-dom';
import {h} from '@cycle/dom';
import CustomDrivers from './drivers';

import todos from './components/todos/index';
import counter from './components/counter';

/* Nested Dialogues (awesome approach)

	app ->
		smallDialogue1(MVI or nothing)
		dialogue1(MVI)
		largeDialogue2(Redux Dialogue) ->
			nestedDialogue1
			...
		dialogue2(MVI)

TODOs:
- how namespace?
- how scoping?
- how routing?
- write about how split your dialogues (nothing, MVI and Redux Dialogue)
- write about what I learned with this experiment
- propose an API for Nested Dialogues
- implement the API
- write some docs, tutorials and well documented examples

*/

// Static composition, this main is statically composed

// All side effect in the main app, todos are just a component
function main({DOM, hashchange, initialHash, localStorageSource}) {
	let todosResponses1 = todos({DOM, hashchange, initialHash, localStorageSource})
	let todosResponses2 = todos({DOM, hashchange, initialHash, localStorageSource})
	let counterResponses = counter({DOM, props$: Rx.Observable.just({value: 0})}, 'counter')

	let vtree$ = Rx.Observable.just(
		h('div',[
			todosResponses1.DOM,
			counterResponses.DOM
		])
	)
	return {
		DOM: vtree$,
		localStorageSink: todosResponses1.localStorageSink
	}
}

run(main, {
  DOM: CycleDOM.makeDOMDriver('.app'),
  localStorageSource: CustomDrivers.makeLocalStorageSourceDriver('todos-cycle'),
  localStorageSink: CustomDrivers.makeLocalStorageSinkDriver('todos-cycle'),
  initialHash: () => Rx.Observable.just(window.location.hash),
  hashchange: () => Rx.Observable.fromEvent(window, 'hashchange')
});
