
export default function createState(reducers$, initialState$) {
  return initialState$
    .merge(reducers$)
    .scan((todosData, modFn) => modFn(todosData))
    .shareReplay(1);
};
