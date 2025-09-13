import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
// npm i firebase-admin firebase-functions
const functions = require("firebase-functions");
const admin = require("firebase-admin");
try { admin.initializeApp(); } catch (_) {}
const db = admin.firestore();

// Exécute toutes les heures
exports.releaseRooms = functions.pubsub.schedule("every 60 minutes").timeZone("Africa/Lome").onRun(async () => {
  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection("rooms")
    .where("status", "==", "en_location")
    .where("releaseDate", "<=", now)
    .get();

  const batch = db.batch();
  snap.forEach(doc => {
    batch.update(doc.ref, { status: "libre", updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  if (!snap.empty) await batch.commit();
  console.log(`Rooms released: ${snap.size}`);
  return null;
});