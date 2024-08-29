import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useChatStore } from '../../lib/chatStore';
import { auth, db } from '../../lib/firebase';
import './details.css';
import { useUserStore } from '../../lib/userStore';
import Avatar from "../../assets/avatar.png"
import useLocationTracking from '../../lib/useLocationTracking';

function Details(){
    const {currentUser} = useUserStore();
    const { user, isCurrentUserBlocked, isReceiverBlocked, changeBlock} = useChatStore();

    const { location, placeName } = useLocationTracking(user?.id);
    const latitude = location?.latitude;
    const longitude = location?.longitude;
    console.log(user);

    const handleBlock = async() => {
        if(!user) return;
        const userDocRef = doc(db, "users", currentUser?.id);
        try{
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user?.id) : arrayUnion(user?.id),
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
            <h3>{user?.username}</h3>
            <p>{user?.about}</p>
        </div>
        <div className="info">
        <span style={{ textAlign:"center", fontSize:"16px", color:placeName==="Location not available"?"silver":"black", fontWeight:"300"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-map" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8z"/>
  <path fill-rule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z"/>
</svg> <a href={latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : "#"}>{placeName}</a></span>
        <button onClick={handleBlock}>{isCurrentUserBlocked?"You are Blocked!" : isReceiverBlocked?"Unblock":"Block User"}</button>
        <button className="logout" onClick={()=> auth.signOut()}>Logout</button>
        </div>
    </div>
  );
}

export default Details;