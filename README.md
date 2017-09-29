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

## Change Log
### v0.4.0
- Added `snapshot` util which returns a snapshot of the Duckbase state for a given path. The snapshot allows you to get the value of the path, as well as additional metadata, such as the loading state of the path.
- Added `hasLoaded` util which is slightly different from `isLoading`: it returns `true` if the data for a path has ever been loaded from firebase.

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
- `mapPropsToPaths(props:` *Object*, `queryBuilder`: *DuckbaseQueryBuilder*): *string | DuckbaseQuery | Array<string | DuckbaseQuery>*

  This function is passed the component props and a `DuckbaseQueryBuilder`. The function can return:
  - a single string representing a firebase path to listen to
  - a single DuckbaseQuery (built using the provided DuckbaseQueryBuilder) 
  - an array of strings and/or DuckbaseQuery objects

### `firebaseReducer(state, action)`

The reducer Duckbase uses to maintain the firebase state. This reducer should typically be combined with your app's reducers when creating the redux store

### `snapshot(state, path): DuckbaseSnapshot`

Gets a snapshot of the Duckbase state for a given path (or query, if provided a `queryName`). The snapshot provides easy access to read the data value of a path as well as metadata such as loading information.

#### Arguments
- `firebaseState` *Object*: The root of the redux state handled by Duckbase. 
- `path` *string* | *Object*: The firebase path to the data, or an object with a `queryName` property to get a snapshot for a query.

#### Returns
Returns a `DuckbaseSnapshot` which has the following methods:
- `val(): any`

   Returns the value of the snapshot. Returns `null` if data does not exist or has not yet been fetched.

- `isFetching(): boolean`

   Returns `true` when the data at this path is being fetched for the first time. Returns `false` otherwise. 
   
   If a component stops listening to a path and then starts listening again later, a new listener will be established, causing this value to be `true` again until the latest data is fetched.
- `hasLoaded(): boolean`

   Returns `true` if the data for this path has ever been loaded (even if it was `null`). 
   
   This will remain true even if a component stops listening to a path and then starts listening to it again. Can be useful for showing a loading indicator only the first time data is fetched, and showing cached data on subsequent loads.

- `lastLoadedTime(): number | null`

    Returns a timestamp in milliseconds of the last time the data for this path has been loaded in Duckbase. Returns `null` if data has never been fetched for this path.

- `lastError(): FirebaseError | null`

    Returns the latest `FirebaseError` that occured while listening to the path (such as a Permission Denied error).
    
    Returns `null` if no errors have occured.

### `getValue(firebaseState, path): any`

Gets data from the firebase redux state at the specified path. Returns `null` if at any point in the path the data is empty.

#### Arguments
- `firebaseState` *Object*: The root of the redux state handled by Duckbase. 
- `path` *string*: The firebase path to the data.

### `getQueryValue(firebaseState, queryName): any`

Gets data for a named query from the firebase redux state. Returns `null` if the query returned no data.

#### Arguments
- `firebaseState` *Object*: The root of the redux state handled by Duckbase. 
- `queryName` *string*: A query name specified in a `DuckbaseQuery` via the `name()` call.

### `hasLoaded(firebaseState, path): boolean`

Returns `true` when the data at this path has been loaded at least once. 

This can be useful for when you want to show a loading indicator only when fetching data for the first time. This allows you to display cached data on subsequent loads without a loading indicator.

Returns `false` only if the data has never been fetched from firebase.

#### Arguments
- `firebaseState` *Object*: The root of the redux state handled by Duckbase. 
- `path` *string*: The firebase path to the data.

### `isLoading(firebaseState, path): boolean`

Returns `true` when the data at this path is being fetched for the first time. Returns `false` otherwise.

#### Arguments
- `firebaseState` *Object*: The root of the redux state handled by Duckbase. 
- `path` *string*: The firebase path to the data.

### `isQueryLoading(firebaseState, queryName): boolean`

Returns `true` when the data for this query is being fetched for the first time. Returns `false` otherwise. 

#### Arguments
- `firebaseState` *Object*: The root of the redux state handled by Duckbase. 
- `queryName` *string*: A query name specified in a `DuckbaseQuery` via the `name()` call.

## License

MIT
