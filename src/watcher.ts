import * as firebase from 'firebase';
import { Store } from 'redux';
import * as FirebaseActions from './actions';
import { diffKeys, getRefFromPath, Path, PathMap } from './query';

export interface Subscriptions {
  [key: string]: Subscription;
}

export interface Subscription {
  count: number;
  ref: firebase.database.Query;
}

export class Duckbase {
  private readonly subscriptions: Subscriptions;
  private readonly app: firebase.app.App;
  private readonly store: Store<any>;

  constructor(app: firebase.app.App, store: Store<any>) {
    this.app = app;
    this.store = store;
    this.subscriptions = {};
  }

  watch(prevPaths: PathMap, nextPaths: PathMap) {
    this.subscribe(diffKeys(nextPaths, prevPaths));
    this.unsubscribe(diffKeys(prevPaths, nextPaths));
  }

  subscribe(paths: Path[]) {
    paths.forEach(path => {
      const subscription = this.subscriptions[path.key];

      if (subscription) {
        subscription.count++;
      } else {
        const ref = getRefFromPath(this.app, path);
        this.subscriptions[path.key] = { count: 1, ref };

        this.store.dispatch(FirebaseActions.startFetch({ path }));

        ref.on('value', (response) => {
          const value = response && response.val();
          this.store.dispatch(FirebaseActions.setNodeValue({ path, value }));
        }, (error: any) => {
          console.error(error); // tslint:disable-line:no-console
        });
      }
    });
  }

  unsubscribe(paths: Path[]) {
    paths.forEach(path => {
      const subscription = this.subscriptions[path.key];

      if (subscription) {
        if (subscription.count === 1) {
          this.store.dispatch(FirebaseActions.stopListening({ path }));
          subscription.ref.off('value');
          delete this.subscriptions[path.key];
        } else {
          subscription.count--;
        }
      }
    });
  }
}
