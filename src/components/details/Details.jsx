import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useChatStore } from '../../lib/chatStore';
import { auth, db } from '../../lib/firebase';
import './details.css';
import { useUserStore } from '../../lib/userStore';
import Avatar from "../../assets/avatar.png"

function Details(){
    const {currentUser} = useUserStore();
    const {chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock} = useChatStore();

    const handleBlock = async() => {
        if(!user) return;
        const userDocRef = doc(db, "users", currentUser.id);
        try{
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            });
            changeBlock();
        } catch(err){
            console.log(err);
        }
    }

  return (
    <div className='details'>
        <div className="user">
            <img src={user?.avatar || Avatar} alt="" />
            <h2>{user?.username}</h2>
            <p>{currentUser?.about}</p>
        </div>
        <div className="info">
        <button onClick={handleBlock}>{isCurrentUserBlocked?"You are Blocked!" : isReceiverBlocked?"Unblock":"Block User"}</button>
        <button className="logout" onClick={()=> auth.signOut()}>Logout</button>
        </div>
    </div>
  );
}

export default Details;