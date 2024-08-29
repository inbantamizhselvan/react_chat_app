import { useState } from 'react';
import './login.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import {auth, db} from "../../lib/firebase"
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import upload from '../../lib/upload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import AvatarImg from "../../assets/avatar.png";

function Login(){
    const [avatar, setAvatar] = useState({
        file: null,
        url: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [userInfo, setUserInfo] = useState({
        username:"",
        email:"",
        password:"",
    })
    
    const handleAvatar = e => {
        if(e.target.files[0]){
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]),
            });
        }
    };

    const handleLogin = async(e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const {email, password} = Object.fromEntries(formData);

        try {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const res = await signInWithEmailAndPassword(auth, email, password);
                    toast.success("Login Successful");
                    await updateDoc(doc(db, "users", res.user.uid), {
                        location: {
                            latitude,
                            longitude,
                        },
                    });
                    window.location.reload();
                },
                (error) => {
                    console.error("Error getting location: ", error);
                    toast.error("Geolocation permission denied. Location data will not be saved.");
                }
            );
        }catch(err){    
            console.log(err);
            toast.error(err.message);
        }
        finally{
            setLoading(false);
        }
    };

    const handleRegister = async(e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);

        const {username, email, password} = Object.fromEntries(formData);

        try {
            const q = query(collection(db, "users"), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                toast.error("Username is already taken. Please choose a different one.");
                setLoading(false);
                return;
            }
            const res = await  createUserWithEmailAndPassword(auth, email, password);
            const user = res.user;
            await sendEmailVerification(user);
            const imgUrl = await upload(avatar.file);
            await setDoc(doc(db, "users", res.user.uid),{
                username: userInfo.username,
                email: userInfo.email,
                avatar:imgUrl,
                id: res.user.uid,
                blocked: [],
            });

            await setDoc(doc(db, "userchats", res.user.uid),{
                chats: []
            });
            toast.success("Account created successfully! You can Login now.");
        } catch(err){
            console.log(err);
            toast.error(err.message);
        } finally{
            setLoading(false);
        }
    };

    return (
        <div className='login'>
            <div className="item">
                <h2>Login here!</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder='Email' name="email" />
                    <div className="password-field">
                    <input
                            type={showPassword ? "text" : "password"}
                            placeholder='Password'
                            name="password"
                        />
                        <span
                            className="eye-icon"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </span>
                    </div>
                    <button type="submit" disabled={loading}>Sign In</button>
                </form>
            </div>
            <div className="seperator"></div>
            <div className="item">
                <h2>Create an Account!</h2>
                <form onSubmit={handleRegister}>
                    <label htmlFor="file">
                        <img src={avatar.url || AvatarImg} alt="" /> Upload an Image
                    </label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                    <input type="text" placeholder='Username' name="username" maxLength="16" value={userInfo.username} onChange={(e)=>setUserInfo(prev => ({ ...prev, username: e.target.value }))}/>
                    <input type="text" placeholder='Email' name="email" value={userInfo.email} onChange={(e)=>setUserInfo(prev => ({ ...prev, email: e.target.value }))}/>
                    <div className="password-field">
                    <input
                            type={showPassword ? "text" : "password"}
                            placeholder='Password'
                            name="password"
                            value={userInfo.password}
                            onChange={(e)=>setUserInfo(prev => ({ ...prev, password: e.target.value }))}
                            minLength="8"
                            maxLength="20"
                        />
                        <span
                            className="eye-icon"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </span>
                        </div>
                    <button type="submit" disabled={loading}>{loading ? "loading" : "Sign Up"}</button>
                </form>
            </div>
        </div>
    );
}

export default Login;