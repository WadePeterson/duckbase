import { Store } from 'redux';
import * as firebase from 'firebase';
import * as FirebaseActions from './actions';

export type Subscriptions = { [key: string]: number };

export class FirebaseWatcher {
  private subscriptions: Subscriptions;
  private app: firebase.app.App;

  constructor(app: firebase.app.App) {
    this.app = app;
    this.subscriptions = {};
  }

  subscribe(store: Store<any>, paths: string[]) {
    paths.forEach(path => {
      const subscriptionCount = this.subscriptions[path] || 0;
      if (subscriptionCount === 0) {
        this.app.database().ref(path).on('value', (response) => {
          const value = response && response.val();
          store.dispatch(FirebaseActions.setNodeValue({ path, value }));
        }, (err: any) => {
          if (err) {
            console.error(err);
          }
        });
      }

      this.subscriptions[path] = subscriptionCount + 1;
    });
  }

  unsubscribe(paths: string[]) {
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
