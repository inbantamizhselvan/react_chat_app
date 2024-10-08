import { arrayUnion, collection, doc,  getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import './addUser.css';
import { db } from '../../../../lib/firebase';
import { useState } from 'react';
import { useUserStore } from '../../../../lib/userStore';
import Search from "../../../../assets/search.png";
import Avatar from "../../../../assets/avatar.png";
import { toast } from 'react-toastify';

function AddUser(){
  const [user, setUser] = useState(null);
  const{currentUser} = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    if(username === currentUser.username){
      toast.warn("You can't add yourself!");
    }else {
    try{
      const userRef = collection(db,"users");
      const q = query(userRef, where("username", "==", username));

      const querySnapShot = await getDocs(q);

      if(!querySnapShot.empty){
        setUser(querySnapShot.docs[0].data());
      }
    }catch(err){
      console.log(err);
    }
  }
  }

  const handleAdd = async() => {
    const chatRef = collection(db,"chats");
    const userChatsRef = collection(db, "userchats");

    try{
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: "",
            recieverId: currentUser.id,  // Your ID as the sender
            updatedAt: Date.now(),
        }),
    });
    
    await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
            chatId: newChatRef.id,
            lastMessage: "",
            recieverId: user.id,  // The ID of the user you are adding
            updatedAt: Date.now(),
        }),
    });

    }catch(err){
      console.log(err);
    }
  }
  return (
    <div className='addUser'>
        <form onSubmit={handleSearch}>
            <input type="text" placeholder='Username' name="username" />
            <button><img src={Search} alt="" /><span>Search</span></button>
        </form>
        {user && <div className="user">
            <div className="detail">
                <img src={user.avatar || Avatar} alt="" />
                <span>{user.username}</span>
            </div>
            <button onClick={handleAdd}>Add Users</button>
        </div>}
    </div>
  );
}

export default AddUser;