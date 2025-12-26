export const firebaseConfig = {
      // YOUR CONFIG HERE (get from Firebase Console)
};

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
