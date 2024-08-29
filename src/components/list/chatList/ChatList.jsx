import { useEffect, useState } from 'react';
import './chatList.css';
import AddUser from './addUser/AddUser';
import { useUserStore } from '../../../lib/userStore';
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from '../../../lib/firebase';
import { useChatStore } from '../../../lib/chatStore';
import Avatar from "../../../assets/avatar.png";
import Plus from "../../../assets/plus.png";
import Minus from "../../../assets/minus.png";
import Search from "../../../assets/search.png";

function ChatList(){
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState("");
    const {currentUser} = useUserStore();
    const {changeChat} =useChatStore();
    console.log(currentUser.id);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "userchats", currentUser.id), 
        async(res) => {
            console.log(res);
            console.log(res.data());
            const items = res.data().chats;
            const promises = items.map( async(item) => {
                const userDocRef = doc(db, "users", item.recieverId);
                const userDocSnap = await getDoc(userDocRef);

                const user = userDocSnap.data();
                return {...item, user};
            });
            const chatData = await Promise.all(promises);
            setChats(chatData.sort((a,b)=>b.updatedAt - a.updatedAt));
;        });

        return () => {
            unSub()
        }
    }, [currentUser.id]);

    const handleSelect = async(chat) => {
        const userChats = chats.map(item => {
            const {user, ...rest} = item;
            return rest;
        });

        const chatIndex = userChats.findIndex(item => item.chatId ===chat.chatId);
        userChats[chatIndex].isSeen = true;
        const userChatsRef = doc(db, "userchats", currentUser.id);

        try{
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
            changeChat(chat.chatId, chat.user);
        } catch(err){
            console.log(err);
        }

    }

    const filteredChats = chats.filter(c => c.user?.username.toLowerCase().includes(input.toLowerCase()));
  return (
    <div className='chatList'>
        <div className="search">
            <div className="searchBar">
                <img src={Search} alt="" />
                <input type="text" placeholder='Search' onChange={(e)=>setInput(e.target.value)}/>
            </div>
            <img src={addMode ? Minus : Plus} alt="" className='add' onClick={() => setAddMode((prev) => !prev)}/>
        </div>
        {filteredChats.map((chat) => (
        <div className="item" key={chat.chatId} onClick={() =>handleSelect(chat)} style={{backgroundColor: chat?.isSeen ? "transparent":"limegreen",}}>
            <img src={chat.user.blocked.includes(currentUser.id)? Avatar:chat.user.avatar || Avatar} alt="" />
            <div className="texts">
                <span>{chat.user.blocked.includes(currentUser.id)?"User":chat.user.username}</span>
                <p>{chat.lastMessage}</p>
            </div>
        </div>
        ))}
        {addMode && <AddUser />}
    </div>
  );
}

export default ChatList;