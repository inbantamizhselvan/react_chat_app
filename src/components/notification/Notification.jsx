import { ToastContainer } from 'react-toastify';


function Notification(){
  return (
    <div className='notification'>
        <ToastContainer position="bottom-right" />
    </div>
  );
}

export default Notification;