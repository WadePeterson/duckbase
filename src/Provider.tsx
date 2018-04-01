import * as firebase from 'firebase';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { Store } from 'redux';
import { Duckbase } from './watcher';

export interface FirebaseProviderProps {
  children: React.ReactNode;
  firebaseApp: firebase.app.App;
  store: Store<any>;
  waitForAuth?: boolean;
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
    this.state = { initialized: !props.waitForAuth };

    let onAuthInit = () => { };

    if (props.waitForAuth) {
      const initTimeout = setTimeout(() => {
        if (!this.state.initialized) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Timed out waiting for firebase auth to initialize'); // tslint:disable-line:no-console
          }
          this.setState({ initialized: true });
        }
      }, 1000);

      onAuthInit = () => {
        clearTimeout(initTimeout);
        this.setState({ initialized: true });
      };
    }

    this.duckbase = new Duckbase(props.firebaseApp, props.store, onAuthInit);
  }

  getChildContext() {
    return { duckbase: this.duckbase };
  }

  render() {
    return this.state.initialized ? React.Children.only(this.props.children) : null;
  }
}
