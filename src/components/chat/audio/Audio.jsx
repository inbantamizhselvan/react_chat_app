import { useEffect, useRef, useState } from 'react';
import './audio.css';
import { useUserStore } from '../../../lib/userStore';

function Audio(props){
    const [call, setCall] = useState(true);

    const {user} = useUserStore();
    console.log(props.username, props.avatar);
    const audioRef = useRef(null);
    useEffect(() => {
        if (call) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; 
        }
    }, [call]);

    return (
            <div className='audio'>
                            <audio
                ref={audioRef}
                src="./dial-tone.mp3" 
                loop
            ></audio>
                <h3>{props.username}</h3>
                <div className="items">
                    <img src={props.avatar || "./avatar.png"} alt="Avatar" />
                </div>
                <div className="bottom">
                    <p className='blink'>ringing...</p>
                    <button onClick={() => props.setAudio(false)}>
                        <img src="./phone.png" alt="End Call" />
                    </button>
                </div>
            </div>
    );
}

export default Audio;
