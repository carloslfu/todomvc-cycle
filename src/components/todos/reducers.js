import {Rx} from '@cycle/core';

function getFilterFn(route) {
  switch (route) {
    case '/active': return (task => task.completed === false);
    case '/completed': return (task => task.completed === true);
    default: return () => true; // allow anything
  }
}

function searchTodoIndex(todosList, todoid) {
  let top = todosList.length;
  let bottom = 0;
  let pointerId;
  let index;
  for (var i = todosList.length - 1; i >= 0; i--) { // binary search
    index = bottom + ((top - bottom) >> 1);
    pointerId = todosList[index].id;
    if (pointerId === todoid) {
      return index;
    } else if (pointerId < todoid) {
      bottom = index;
    } else if (pointerId > todoid) {
      top = index;
    }
  }
  return null;
}

export default function createReducers(actions) {
  let clearInputRd$ = actions.clearInput$.map(() => (todosData) => {
    return todosData;
  });

  let insertTodoRd$ = actions.insertTodo$.map((todoTitle) => (todosData) => {
    let lastId = todosData.list.length > 0 ?
      todosData.list[todosData.list.length - 1].id :
      0;
    todosData.list.push({
      id: lastId + 1,
      title: todoTitle,
      completed: false
    });
    return todosData;
  });

  let editTodoRd$ = actions.editTodo$.map(action => (todosData) => {
    let todoIndex = searchTodoIndex(todosData.list, action.id);
    todosData.list[todoIndex].title = action.title;
    return todosData;
  });

  let toggleTodoRd$ = actions.toggleTodo$.map(id => (todosData) => {
    let todoIndex = searchTodoIndex(todosData.list, id);
    let previousCompleted = todosData.list[todoIndex].completed;
    todosData.list[todoIndex].completed = !previousCompleted;
    return todosData;
  });

  let toggleAllRd$ = actions.toggleAll$.map(() => (todosData) => {
    let allAreCompleted = todosData.list
      .reduce((x, y) => x && y.completed, true);
    todosData.list.forEach((todoData) => {
      todoData.completed = allAreCompleted ? false : true;
    });
    return todosData;
  });

  let deleteTodoRd$ = actions.deleteTodo$.map(id => (todosData) => {
    let todoIndex = searchTodoIndex(todosData.list, id);
    todosData.list.splice(todoIndex, 1);
    return todosData;
  });

  let deleteCompletedsRd$ = actions.deleteCompleteds$.map(() => (todosData) => {
    todosData.list = todosData.list
      .filter(todoData => todoData.completed === false);
    return todosData
  });

  let changeRouteRd$ = actions.changeRoute$.startWith('/').map(route => {
    let filter = route.replace('/', '').trim();
    let filterFn = getFilterFn(route);
    return (todosData) => {
      todosData.filter = filter;
      todosData.filterFn = filterFn;
      return todosData;
    }
  });

  return Rx.Observable.merge(
    insertTodoRd$, deleteTodoRd$, toggleTodoRd$, toggleAllRd$,
    clearInputRd$, deleteCompletedsRd$, editTodoRd$, changeRouteRd$
  );
}
