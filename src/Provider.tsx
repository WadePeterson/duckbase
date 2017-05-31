import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Subscriptions } from './connect';

export interface FirebaseProviderProps {
  children: React.ReactNode;
  firebaseApp: firebase.app.App;
}

export default class FirebaseProvider extends React.Component<FirebaseProviderProps, {}> {
  private app: firebase.app.App;
  private subscriptions: Subscriptions;

  static childContextTypes = {
    firebaseApp: PropTypes.object,
    firebaseSubscriptions: PropTypes.object
  }

  constructor(props: FirebaseProviderProps, context: any) {
    super(props, context);
    this.app = props.firebaseApp;
    this.subscriptions = {};
  }

  getChildContext() {
    return { firebaseApp: this.app, firebaseSubscriptions: this.subscriptions };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
