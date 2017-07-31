import * as PropTypes from 'prop-types';
import * as React from 'react';
import { Store } from 'redux';
import { Duckbase } from './watcher';

export interface FirebaseProviderProps {
  children: React.ReactNode;
  firebaseApp: firebase.app.App;
  store: Store<any>;
}

export default class FirebaseProvider extends React.Component<FirebaseProviderProps, {}> {
  private duckbase: Duckbase;

  static childContextTypes = {
    duckbase: PropTypes.object
  };

  constructor(props: FirebaseProviderProps, context: any) {
    super(props, context);
    this.duckbase = new Duckbase(props.firebaseApp, props.store);
  }

  getChildContext() {
    return { duckbase: this.duckbase };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
