import * as firebase from 'firebase';

export interface User {
  creationTime: string | null;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  lastSignInTime: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  providerId: string;
  uid: string;
}

export function getUserInfo(user: firebase.User): User {
  return {
    creationTime: (user.metadata && user.metadata.creationTime) || null,
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    lastSignInTime: (user.metadata && user.metadata.lastSignInTime) || null,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
    providerId: user.providerId,
    uid: user.uid,
  };
}
