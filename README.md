duckbase
=========================
React + Redux Wrapper for Firebase

![Duck Taunt](ducktaunt.jpg)

## Features
- Automatic binding to the data your components need. If more than one component needs the same data, only one listener will be established
- Automatic unbinding for data no longer needed by any components
- Mirror your firebase data in redux without the boilerplate
- Supports Firebase queries
- First class support for Typescript

## Installation
To install the latest version:
```
yarn add duckbase
```
or
```
npm install --save duckbase
```

## Example
Here is an example of using duckbase with a todo app with a calendar integration. The `CalendarReducer` handles the local state for selecting the calendar date range, and the firebase reducer will keep track of mirroring your firebase data.

First, wrap your top level component with the `FirebaseProvider` and add the `firebaseReducer` to your `rootReducer`.

**main.js**
```
import React from 'react';
import ReactDOM from 'react-dom';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { firebaseReducer, FirebaseProvider } from 'duckbase';

import TodoCalendarContainer from './containers/TodoCalendar';
import CalendarReducer from './reducers/calendarReducer';

const firebaseApp = firebase.initializeApp({ /* firebase config */ });

const rootReducer = combineReducers({
  calendar: CalendarReducer, // handles local state for selecting a calendar date range
  firebase: firebaseReducer
});

const store = createStore(rootReducer);

ReactDOM.render(
  <Provider store={store}>
    <FirebaseProvider firebaseApp={firebaseApp} store={store}>
      <TodoCalendarContainer />
    </FirebaseProvider>
  </Provider>
, document.getElementById('app'));
```

**TodoCalendarContainer.js**
```
import { compose } from 'redux';
import { connect } from 'react-redux';
import { firebaseConnect, getQueryValue, getValue } from 'duckbase';
import TodoCalendar from './components/TodoCalendar';

const mapStateToProps = (state) => {
  const currentUserId = state.app.userId;
  const todoListId = getValue(state.firebase, `users/${currentUserId}/todoListId`);
  const todos = getQueryValue(state.firebase, 'currentTodos');

  return {
     currentUserId,
     startDate: state.calendar.startDate,
     endDate: state.calendar.endDate,
     todoListId,
     todos
  };
};

export default compose(
  connect(mapStateToProps),
  firebaseConnect((props, queryBuilder) => {
    return [
      `/users/${currentUserId}`,
      queryBuilder.name('currentTodos')
        .ref(`/todos/${props.todoListId}`)
        .orderByChild('dueDate')
        .startAt(startDate)
        .endAt(endDate)
    ];
  }),
)(TodoCalendar);
```

In the example above, `firebaseConnect()` returns an array with two items, one with a normal fetch and the other with a fancy query.
- The first item is a string `users/${currentUserId}` which uses the `currentUserId` prop returned from `mapStateToProps`. This will cause duckbase to listen to that path and store the data in the firebase redux state. This data can be retrieved in `mapStateToProps` by using the `getValue` helper exported by duckbase. 
- The second item is a query built using the the `queryBuilder` argument. The query is given a name (in this case "currentTodos"). This name is passed to `getQueryValue` in `mapStateToProps` to retrieve the data associated with the query.

## API

### `<FirebaseProvider store firebaseApp>`
Makes the Redux store and firebaseApp available to the `firebaseConnect()` calls. You should have this high in your app component hierachy, so children components can use `firebaseConnect`.

#### Props
- `store` (*[Redux Store](http://redux.js.org/docs/api/Store.html)*): The single Redux store in your application.
- `firebaseApp` (*[Firebase App](https://firebase.google.com/docs/reference/js/firebase.app.App)*): An instantiated Firebase App

### `firebaseConnect(mapPropsToPaths)`

This function returns paths and/or queries the component will subscribe to. Whenever these paths or queries are updated in firebase, the firebase redux state will be updated

#### Arguments
- `mapPropsToPaths(props:` *Object*`, queryBuilder:` *DuckbaseQueryBuilder*`): `*string | DuckbaseQuery | Array<string | DuckbaseQuery>*

  This function is passed the component props and a `DuckbaseQueryBuilder`. The function can return:
  - a single string representing a firebase path to listen to
  - a single DuckbaseQuery (built using the provided DuckbaseQueryBuilder) 
  - an array of strings and/or DuckbaseQuery objects

### `firebaseReducer(state, action)`

The reducer Duckbase uses to maintain the firebase state. This reducer should typically be combined with your app's reducers when creating the redux store

### `getValue(firebaseState, path)`

Gets data from the firebase redux state at the specified path. Returns `null` if at any point in the path the data is empty.

#### Arguments
- `firebaseState` *Object*: The root of the redux state handled by Duckbase. 
- `path` *string*: The firebase path to the data.

### `getQueryValue(firebaseState, queryName)`

Gets data for a named query from the firebase redux state. The name must be one specified in a `DuckbaseQuery` via the `name()` call. Returns `null` if the query returned no data.

#### Arguments
- `firebaseState` *Object*: The root of the redux state handled by Duckbase. 
- `path` *string*: The firebase path to the data.

## License

MIT
