import * as React from 'react';
import * as PropTypes from 'prop-types';
import { FirebaseWatcher } from './watcher';

export interface FirebaseProviderProps {
  children: React.ReactNode;
  firebaseApp: firebase.app.App;
}

export default class FirebaseProvider extends React.Component<FirebaseProviderProps, {}> {
  private watcher: FirebaseWatcher;

  static childContextTypes = {
    firebaseWatcher: PropTypes.object
  }

  constructor(props: FirebaseProviderProps, context: any) {
    super(props, context);
    this.watcher = new FirebaseWatcher(props.firebaseApp);
  }

  getChildContext() {
    return { firebaseWatcher: this.watcher };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
