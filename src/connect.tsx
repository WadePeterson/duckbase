import * as React from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import * as FirebaseActions from './actions';
import * as firebase from 'firebase';

export type MapPropsToRefs<TProps> = (props: TProps) => string | string[];
export type Subscriptions = { [key: string]: number };

function arrayDiff<T>(a: T[], b: T[]) {
  return a.filter(val => b.indexOf(val) === -1);
}

type PropsWithDispatch<T> = T & { dispatch: Dispatch<any> };

export default function firebaseConnect<TProps, T extends React.ComponentClass<TProps>>(mapPropsToRefs: MapPropsToRefs<TProps>) {
  return (WrappedComponent: T): T => {
    class Container extends React.Component<PropsWithDispatch<TProps>, any> {
      private app: firebase.app.App;
      private subscriptions: Subscriptions;

      static propTypes = {
        dispatch: PropTypes.func.isRequired
      }

      static contextTypes = {
        firebaseApp: PropTypes.object.isRequired,
        firebaseSubscriptions: PropTypes.object.isRequired
      }

      constructor(props: PropsWithDispatch<TProps>, context: any) {
        super(props, context);
        this.app = context.firebaseApp;
        this.subscriptions = context.firebaseSubscriptions;
        this.subscribe(this.getPaths(props));
      }

      componentWillReceiveProps(nextProps: Readonly<PropsWithDispatch<TProps>>) {
        const previousPaths = this.getPaths(this.props);
        const nextPaths = this.getPaths(nextProps);

        // unsubscribe from paths that are no longer needed
        this.unsubscribe(arrayDiff(previousPaths, nextPaths));

        // subscribe to new paths
        this.subscribe(arrayDiff(nextPaths, previousPaths));
      }

      componentWillUnmount() {
        this.unsubscribe(this.getPaths(this.props));
      }

      render() {
        return <WrappedComponent { ...this.props } />;
      }

      getPaths(props: Readonly<TProps>) {
        const paths = mapPropsToRefs(props) || [];
        return Array.isArray(paths) ? paths : [paths];
      }

      subscribe = (paths: string[]) => {
        paths.forEach(path => {
          const subscriptionCount = this.subscriptions[path] || 0;
          if (subscriptionCount === 0) {
            this.app.database().ref(path).on('value', (response: any) => {
              console.log(path, response.val())
              this.props.dispatch(FirebaseActions.setNodeValue({ path, value: response && response.val() }));
            }, (err: any) => console.error(err));
          }
          this.subscriptions[path] = subscriptionCount + 1;
        });
      }

      unsubscribe = (paths: string[]) => {
        paths.forEach(path => {
          const subscriptionCount = this.subscriptions[path] || 0;
          if (subscriptionCount > 0) {
            if (subscriptionCount === 1) {
              this.app.database().ref(path).off('value');
            }
            this.subscriptions[path] = subscriptionCount - 1;
          }
        });
      }
    }

    return connect<TProps>()(Container as any);
  };
}
