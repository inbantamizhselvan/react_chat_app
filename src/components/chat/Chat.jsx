import { useEffect, useRef, useState } from 'react';
import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { addDoc, arrayUnion, collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import upload from '../../lib/upload';
import Audio from './audio/Audio';
import uploadAudio from '../../lib/uploadAudio';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import ImagePic from "../../assets/img.png";
import AvatarImg from "../../assets/avatar.png";
import PhoneImg from "../../assets/phone.png";
import StopVideo from "../../assets/stopVideo.png";
import VideoImg from "../../assets/video.png";
import DialTone from "../../assets/dial-tone.mp3";
import EndPhoneImg from "../../assets/endPhone.png";
import MicImg from "../../assets/mic.png";
import EmojiImg from "../../assets/emoji.png";

function Chat(){
    const [chat, setChat] = useState();
    const [call, setCall] = useState(true);
    const audioRef = useRef(null);
    const videoRef = useRef(null);
    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const [callState, setCallState] = useState("");
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [video, setVideo] = useState(false);
    const [audioCall, setAudioCall] = useState(false);
    const [image, setImage] = useState({
        file: null,
        url: "",
    });

    const {currentUser} = useUserStore();
    const {chatId, user, isCurrentUserBlocked, isReceiverBlocked} = useChatStore();
    console.log(user);

    const endRef = useRef(null);

    useEffect(() =>{
        endRef.current?.scrollIntoView({behavior: "smooth"});
    }, []);

    useEffect(() => {
        const unSub = onSnapshot(doc(db,"chats", chatId),(snapshot) => {
            setChat(snapshot.data());
        });
        return () => {
            unSub();
        };
    }, [chatId]);
    useEffect(() => {
        if (audioRef.current) {
            if (video) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [video]);
    const handleEmoji = e => {
        setText((prev)=>prev+e.emoji);
        setOpen(false);
    };
    function handleVideo(){
        setVideo(!video);
        if(!video){
        initializeCall();
        }
    }
    
    const handleAudioCall = () => setAudioCall(!audioCall);

    const handleImage = e => {
        if(e.target.files[0]){
            setImage({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]),
            });
        }
    };

    const initializeCall = async () => {
        const servers = {
            iceServers: [
                {
                    urls: [
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                    ],
                },
            ],
            iceCandidatePoolSize: 10,
          };
          
          const pc = new RTCPeerConnection(servers);
        const localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        const remoteStream = new MediaStream();
        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });
        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
            });
        };
        localRef.current.srcObject = localStream;
        remoteRef.current.srcObject = remoteStream;


    }


    const formatDate = (date) => {
        if (!date) return 'Unknown date';
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        return `${month} ${day}, ${year}`;
    };

    const formatTime = (date) => {
        if (!date) return 'Unknown time';
        const d = new Date(date);
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm} ` ;
    };

    const handleSend = async() => {
        if(text === "") return;

        let imgUrl= null;

        try{
            if(image.url){
                imgUrl = await upload(image.file);
            }

        } catch(err){
            console.log(err);
        }

        try{
            await updateDoc(doc(db,"chats", chatId), {
                messages: arrayUnion({
                    senderId: currentUser.id,
                    text,
                    createdAt: new Date(),
                    ...(imgUrl && {img: imgUrl}),
                }),
            });

            const userIDs = [currentUser.id, user.id];
            userIDs.forEach(async(id) => {

            const userChatsRef = doc(db, "userchats", id);
            const userChatsSnapshot = await getDoc(userChatsRef);

            if(userChatsSnapshot.exists()){
                const userChatsData = userChatsSnapshot.data();

                const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);
                userChatsData.chats[chatIndex].lastMessage = text.slice(0, 50);
                userChatsData.chats[chatIndex].isSeen = currentUser.id === id? true:false;
                userChatsData.chats[chatIndex].updatedAt = Date.now();

                await updateDoc(userChatsRef, {
                    chats: userChatsData.chats,
                });
            }
        });
        } catch(err){
            console.log(err);
        }

        setImage({
            file: null,
            url: ""
        });
        setText("");
    };
  return (
    <div className='chat'>
        <div className="top">
            <div className="user">
                <img src={isCurrentUserBlocked|| isReceiverBlocked?AvatarImg:user.avatar||AvatarImg} alt="" />
                <div className="texts">
                    <span>{isCurrentUserBlocked || isReceiverBlocked?"User":user.username}</span>
                    <p style={{color:"limegreen"}} disabled={isCurrentUserBlocked||isReceiverBlocked?true:false}>{currentUser.about}</p>
                </div>
            </div>
            <div className="icons">
                <img src={PhoneImg} alt="" onClick={handleAudioCall}/>
                <img src={video?StopVideo:VideoImg} alt=""  onClick={handleVideo}/>
            </div>
            </div>
            <div className="center" style={{backgroundImage:`url("${currentUser?.bgImg || "none"}")`,
                                            backgroundSize: 'cover', 
                                            backgroundPosition: 'center', 
                                            objectFit: 'cover',
                                            backgroundRepeat:"no-repeat"}}>
                {chat?.messages?.map((message) => (
                <div className={message.senderId === currentUser?.id?"message own":"message"} key={message?.createdAt}>
                    <div className="texts">
                        <div className="date">
                        <span>{formatDate(message.createdAt.toDate())}</span>
                        </div>
                        {message.img && <img src={message.img} alt="" />}
                        <p>{message.text}</p>
                        <span>{formatTime(message.createdAt.toDate())}</span>
                    </div>
                </div>
                ))}
                {image.url && <div className="message own">
                    <div className="text">
                        <img src={image.url} alt="" />
                    </div>
                </div>}
                {audioCall && <Audio setAudio={setAudioCall} username={user?.username} avatar={user?.avatar}/>}
                {video && 
                            <div className='video'>
                            <audio
                                ref={audioRef}
                                src={DialTone} 
                                loop
                            ></audio>
                                
                                <div className="items">
                                    <img src={user?.avatar || AvatarImg} alt="Avatar" />
                                    <p>{user.username}</p>
                                </div>
                                <div className="video-call">
                                    {console.log(videoRef)}
                                    <video ref={localRef} autoPlay playsInline />
                                    <video ref={remoteRef} autoPlay playsInline />
                                </div>
                                <div className="bottom">
                                    <p className='blink'>ringing...</p>
                                    <button onClick={() => setVideo(false)}>
                                        <img src={EndPhoneImg} alt="End Call" />
                                    </button>
                                </div>
                            </div>
                }
                <div ref={endRef}></div>
            </div>
            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file"><img src={ImagePic} alt=""/></label>
                    <input type="file" id="file" style={{display:"none"}} onChange={handleImage}/>
                    <div className="mic" /*onMouseDown={handleMicPress} onMouseUp={handleMicRelease}*/> 
                    <img src={MicImg} alt="" />
                    </div>
                </div>
                    <input type="text" placeholder={isCurrentUserBlocked || isReceiverBlocked?"You cannot send a message!":"Type a message ...."} value={text} onChange={e=>setText(e.target.value)} disabled={isCurrentUserBlocked || isReceiverBlocked}/>
                    <div className="emoji">
                        <img src={EmojiImg} alt="" onClick={()=>setOpen((prev) => !prev)}/>
                        <div className="picker">
                        <EmojiPicker open={open} onEmojiClick={handleEmoji}/>
                    </div>
                    </div>
                    <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
                </div>
            </div>
  );
}

export default Chat;