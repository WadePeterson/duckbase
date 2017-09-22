import * as PropTypes from 'prop-types';
import * as React from 'react';
import { DuckbaseQuery, DuckbaseQueryBuilder, PathMap, getPath } from './query';
import { Duckbase } from './watcher';

interface Context {
  duckbase: Duckbase;
}

export type MapPropsToPaths<TProps> = (props: TProps, db: DuckbaseQueryBuilder) => string | DuckbaseQuery | Array<string | DuckbaseQuery>;
export type Component<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

function getDisplayName(WrappedComponent: Component<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default function firebaseConnect<TProps, T extends Component<TProps>>(mapPropsToPaths: MapPropsToPaths<TProps>) {
  const queryBuilder = new DuckbaseQueryBuilder();

  return (WrappedComponent: T): React.ComponentClass<TProps> => {
    const Wrapper: React.ComponentClass<TProps> = class FirebaseConnect extends React.PureComponent<TProps, any> {
      private readonly duckbase: Duckbase;
      private prevPaths: PathMap = {};

      static contextTypes = {
        duckbase: PropTypes.object.isRequired
      };

      constructor(props: TProps, context: Context) {
        super(props, context);
        this.duckbase = context.duckbase;
      }

      componentDidMount() {
        this.watch(this.props);
      }

      componentWillReceiveProps(nextProps: Readonly<TProps>) {
        this.watch(nextProps);
      }

      componentWillUnmount() {
        this.duckbase.watch(this.prevPaths, {});
        this.prevPaths = {};
      }

      watch(props: Readonly<TProps>) {
        const paths = this.getPaths(props);
        this.duckbase.watch(this.prevPaths, paths);
        this.prevPaths = paths;
      }

      render() {
        const Comp = WrappedComponent as any;
        return <Comp { ...this.props } />;
      }

      getPaths(props: Readonly<TProps>): PathMap {
        let pathLikes = mapPropsToPaths(props, queryBuilder) || [];
        pathLikes = Array.isArray(pathLikes) ? pathLikes : [pathLikes];
        return pathLikes.reduce((acc, pathLike) => {
          const path = getPath(pathLike);
          return Object.assign(acc, { [path.key]: path });
        }, {});
      }
    };

    Wrapper.displayName = `FirebaseConnect(${getDisplayName(WrappedComponent)})`;

    return Wrapper;
  };
}
