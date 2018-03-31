import * as firebase from 'firebase';
import { Store } from 'redux';
import * as FirebaseActions from './actions';
import { getUserInfo } from './auth';
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

  constructor(app: firebase.app.App, store: Store<any>, onInit: () => any) {
    this.app = app;
    this.store = store;
    this.subscriptions = {};

    let initialized = false;
    app.auth().onAuthStateChanged(authUser => {
      const user = authUser ? getUserInfo(authUser) : null;
      store.dispatch(FirebaseActions.setAuthState({ user }));
      if (!initialized) {
        initialized = true;
        onInit();
      }
    }, error => {
      store.dispatch(FirebaseActions.setAuthError({ error }));
    });
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
          this.store.dispatch(FirebaseActions.setError({ error, path }));
          if (process.env.NODE_ENV !== 'production') {
            console.warn(error.toString()); // tslint:disable-line:no-console
          }
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
