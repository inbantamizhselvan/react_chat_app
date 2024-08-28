import { useEffect, useState } from 'react';
import { useUserStore } from '../../../lib/userStore';
import './userInfo.css';
import upload from '../../../lib/upload';
import { collection, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import Avatar from "../../../assets/avatar.png";
import ClickedEdit from "../../../assets/clickedEdit.png";
import EditImg from "../../../assets/edit.png";
import CancelImg from "../../../assets/cancel.png";
import { toast } from 'react-toastify';

function UserInfo() {
  const { currentUser } = useUserStore();
  const [edit, setEdit] = useState(false);
  const [user, setUser] = useState();
  const [cancel, setCancel] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [bgImg, setBgImg] = useState({
    file: null,
    url: "",
  });
  const [username, setUsername] = useState(currentUser.username || '');
  const [about, setAbout] = useState(currentUser.about || '');

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "users", currentUser.id), (snapshot) => {
      setUser(snapshot.data());
    });
    return () => {
      unSub();
    };
  }, [currentUser?.id]);

  const handleClick = () => {
    setEdit((prev) => !prev);
  };

  const handleAvatar = e => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleBg = e => {
    setCancel(true);
    if (e.target.files[0]) { // Change #1: Handle background image selection
      setBgImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleCancel = () => {
    setBgImg({
      file: null,
      url: "",  // Change #2: Reset background image to null and empty URL
    });
    setCancel(false);
  };
  const handleRemoveBackground = () => {
    setRemoveBg(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const about = formData.get("about");
    try {
      if(username !== currentUser?.username){
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          toast.error("Username is already taken. Please choose a different one.");
          return;
      }
    }
      const imgUrl = avatar.file ? await upload(avatar.file) : currentUser.avatar;
      const bgUrl = removeBg?"null":bgImg.file ? await upload(bgImg.file) : currentUser.bgImg; 
      if(removeBg){
        setRemoveBg(false);
      } // Change #3: Consider bgImg state
      await setDoc(doc(db, "users", currentUser?.id), {
        username,
        avatar: imgUrl,
        bgImg: bgUrl,
        about,
        email: currentUser.email,
        id: currentUser.id,
        blocked: [],
      });
      if(cancel){
      window.location.reload();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setEdit(false);
    }
  };

  return (
    <div className='userInfo'>
      <div className='user'>
        <img src={user?.avatar || Avatar} alt="" />
        <div className="info">
        <h5>{user?.username}</h5>
        {user?.about && <span>{user?.about}</span>}
        </div>
      </div>
      <div className='icons'>
        <img src={edit ? ClickedEdit : EditImg} alt='' onClick={handleClick} />
      </div>
      {edit &&
        <form onSubmit={handleSubmit}>
          <div className="edit">
            <label htmlFor="file">
              <img src={avatar.url || currentUser.avatar} alt="" /> Upload an Image
            </label>
            <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
            <div className="username">
              <h3>Username:</h3>
              <input type="text" placeholder='Enter your Username' name='username' value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="about">
              <h3>About:</h3>
              <input type="text" placeholder='About Yourself' name='about' value={about} onChange={(e) => setAbout(e.target.value)} />
            </div>
            <label htmlFor="background">
              <img src={bgImg.url || currentUser?.bgImg} alt="" /> Change Background
              {/* Change #4: Cancel button triggers handleCancel */}
            </label>{cancel && <img src={CancelImg} alt="" className='cancel' onClick={handleCancel} />} 
            <input type="file" id="background" style={{ display: "none" }} onChange={handleBg} />
            <div className="submitButton">
              <button type='submit'>Apply Changes</button>
              <button style={{ backgroundColor: "red" }} onClick={() => auth.signOut()}>Sign Out</button>
              <button style={{ backgroundColor: removeBg?"black":"Silver" }} onClick={handleRemoveBackground}>{removeBg?"Click on Apply changes":"Remove Background"}</button>
            </div>
          </div>
        </form>
      }
    </div>
  );
}

export default UserInfo;
