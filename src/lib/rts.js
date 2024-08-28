import { RTCPeerConnection } from "react-native-webrtc";

// rtc.js
export const createPeerConnection = (onIceCandidate, onTrack) => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
  
    const peerConnection = new RTCPeerConnection(config);
  
    peerConnection.onIceCandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };
  
    peerConnection.ontrack = (event) => {
      onTrack(event.streams[0]);
    };
  
    return peerConnection;
  };
  