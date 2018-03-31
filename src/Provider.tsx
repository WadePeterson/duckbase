import * as firebase from 'firebase';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { Store } from 'redux';
import { Duckbase } from './watcher';

export interface FirebaseProviderProps {
  children: React.ReactNode;
  firebaseApp: firebase.app.App;
  store: Store<any>;
}

export interface FirebaseProviderState {
  initialized: boolean;
}

export default class FirebaseProvider extends React.Component<FirebaseProviderProps, FirebaseProviderState> {
  private duckbase: Duckbase;

  static childContextTypes = {
    duckbase: PropTypes.object
  };

  constructor(props: FirebaseProviderProps, context: any) {
    super(props, context);
    this.state = { initialized: false };
    this.duckbase = new Duckbase(props.firebaseApp, props.store, () => setTimeout(this.setState({ initialized: true })));
  }

  getChildContext() {
    return { duckbase: this.duckbase };
  }

  render() {
    return this.state.initialized ? React.Children.only(this.props.children) : null;
  }
}
