import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Dispatch, Store } from 'redux';
import { FirebaseWatcher } from './watcher';

export type MapPropsToPaths<TProps> = (props: TProps) => string | string[];

function arrayDiff<T>(a: T[], b: T[]) {
  return a.filter(val => b.indexOf(val) === -1);
}

interface Context {
  firebaseWatcher: FirebaseWatcher;
  store: Store<any>;
}

export type Component<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

export default function firebaseConnect<TProps, T extends Component<TProps>>(mapPropsToPaths: MapPropsToPaths<TProps>) {
  return (WrappedComponent: T): React.ComponentClass<TProps> => {
    return class Container extends React.Component<TProps, any> {
      private readonly watcher: FirebaseWatcher;
      private readonly store: Store<any>;

      static contextTypes = {
        firebaseWatcher: PropTypes.object.isRequired,
        store: PropTypes.object.isRequired
      }

      constructor(props: TProps, context: Context) {
        super(props, context);
        this.watcher = context.firebaseWatcher;
        this.store = context.store;
      }

      componentDidMount() {
        this.watcher.subscribe(this.store, this.getPaths(this.props));
      }

      componentWillReceiveProps(nextProps: Readonly<TProps>) {
        const previousPaths = this.getPaths(this.props);
        const nextPaths = this.getPaths(nextProps);

        // unsubscribe from paths that are no longer needed
        this.watcher.unsubscribe(arrayDiff(previousPaths, nextPaths));

        // subscribe to new paths
        this.watcher.subscribe(this.store, arrayDiff(nextPaths, previousPaths));
      }

      componentWillUnmount() {
        this.watcher.unsubscribe(this.getPaths(this.props));
      }

      render() {
        const Comp = WrappedComponent as any;
        return <Comp { ...this.props } />;
      }

      getPaths(props: Readonly<TProps>) {
        const paths = mapPropsToPaths(props) || [];
        return this.normalizePaths(Array.isArray(paths) ? paths : [paths]);
      }

      normalizePaths(paths: string[]) {
        return paths.map((path) => path.split('/').filter((p) => !!p).join('/'));
      }
    }
  };
}
