import { useEffect, useRef, useState } from 'react';
import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import upload from '../../lib/upload';
import 'react-h5-audio-player/lib/styles.css';
import ImagePic from "../../assets/img.png";
import AvatarImg from "../../assets/avatar.png";
import MicImg from "../../assets/mic.png";
import EmojiImg from "../../assets/emoji.png";
import locationImg from "../../assets/pin-img.png"
import useLocationTracking from '../../lib/useLocationTracking';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';


function Chat(){
    const [chat, setChat] = useState();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [sendLocation, setSendLocation] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState();
    const [messageClick, setMessageClick] = useState(false);
    const [image, setImage] = useState({
        file: null,
        url: "",
    });

    const {currentUser} = useUserStore();
    const {chatId, user, isCurrentUserBlocked, isReceiverBlocked} = useChatStore();
    const {location} = useLocationTracking(currentUser?.id);
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
    const handleEmoji = e => {
        setText((prev)=>prev+e.emoji);
        setOpen(false);
    };
    const generateLocationURL = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude}%2C${longitude}`;
    };

    const handleClick = (message) =>{
        setMessageClick((prev)=>!prev);
        setSelectedMessage(message?.id);
        console.log(message?.id);
    }

    const handleDelete = async() => {
        console.log(selectedMessage);
        setMessageClick(false);
        if(!selectedMessage) return;
        try{
            const chatRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatRef);
            if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                const updatedMessages = chatData.messages.filter((msg) => msg.id !== selectedMessage);
                await updateDoc(chatRef, {
                    messages: updatedMessages,
                });
            }
        }catch(error){
            console.log(error);
        }
    };


    const handleLocation = () => {
        if(location){
        console.log(location);
        const { latitude, longitude } = location;
        const locationURL = generateLocationURL(latitude, longitude);
        const linkHTML = `<a href="${locationURL}" target="_blank" rel="noopener noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-map" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8z"/>
  <path fill-rule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z"/>
</svg> View Location</a>`;
        setText(((prev)=> prev+`${linkHTML}`));
        setSendLocation(true);
        }else{
            toast.error("Turn on your Location! and try again.");
        }
    }

    const handleImage = e => {
        if(e.target.files[0]){
            setImage({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]),
            });
        }
    };


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
        const messageId = uuidv4();

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
                    id: messageId,
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
                userChatsData.chats[chatIndex].lastMessage = sendLocation?"Location":text.slice(0, 50);
                userChatsData.chats[chatIndex].isSeen = currentUser.id === id? true:false;
                userChatsData.chats[chatIndex].updatedAt = Date.now();
                await updateDoc(userChatsRef, {
                    chats: userChatsData.chats,
                });
            }
            setSendLocation(false);
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
                    <p style={{color:"limegreen"}} disabled={isCurrentUserBlocked||isReceiverBlocked?true:false}>{user?.about}</p>
                </div>
            </div>
            </div>
            <div className="center" style={{backgroundImage:`url("${currentUser?.bgImg || "none"}")`,
                                            backgroundSize: 'cover', 
                                            backgroundPosition: 'center', 
                                            objectFit: 'cover',
                                            backgroundRepeat:"no-repeat"}}>
                {chat?.messages?.map((message) => (
                <div className={message.senderId === currentUser?.id?"message own":"message"} key={message?.createdAt} onClick={()=>handleClick(message)}>
                    <div className="texts" >
                        <div className="date">
                        <span>{formatDate(message.createdAt.toDate())}</span>
                        </div>
                        {message.img && 
                            <img src={message.img} alt="" />}
                        <p dangerouslySetInnerHTML={{ __html: message.text }} />
                        {messageClick && message?.senderId===currentUser?.id && selectedMessage === message?.id && (
                                <button onClick={handleDelete} className='messageDelete'>Delete</button>
                            )}
                        <span>{formatTime(message.createdAt.toDate())}</span>
                    </div>
                </div>
                ))}
                {image.url && <div className="message own">
                    <div className="text">
                        <img src={image.url} alt="" />
                    </div>
                </div>}
                <div ref={endRef}></div>
            </div>
            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file"><img src={ImagePic} alt=""/></label>
                    <input type="file" id="file" style={{display:"none"}} onChange={handleImage}/>
                    <div className="mic"> 
                    <img src={MicImg} alt="" />
                    </div>
                    <img src={locationImg} alt="" onClick={handleLocation}/>
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