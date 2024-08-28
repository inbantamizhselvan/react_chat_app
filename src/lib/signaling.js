// signaling.js
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, updateDoc, onSnapshotsInSync, arrayUnion } from "firebase/firestore";


// Function to create a new call
export const createCall = async (callerId) => {
    const callDoc = doc(collection(db, "calls"));
    await setDoc(callDoc, { callerId, offer: null, answer: null, candidates: [] });
    return callDoc.id;
};

// Function to update the offer
export const setOffer = async (callId, offer) => {
    const callDoc = doc(db, "calls", callId);
    await updateDoc(callDoc, { offer });
};

// Function to update the answer
export const setAnswer = async (callId, answer) => {
    const callDoc = doc(db, "calls", callId);
    await updateDoc(callDoc, { answer });
};

// Function to add ICE candidates
export const addIceCandidate = async (callId, candidate) => {
    const callDoc = doc(db, "calls", callId);
    await updateDoc(callDoc, { candidates: arrayUnion(candidate) });
};

// Function to listen for call updates
export const listenForCallUpdates = (callId, callback) => {
    const callDoc = doc(db, "calls", callId);
    return onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data) {
            callback(data);
        } else {
            console.error('No data found for the given callId');
        }
    }, (error) => {
        console.error('Error listening for call updates:', error);
    });
};
