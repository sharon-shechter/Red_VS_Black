import { useState, useRef } from 'react';

export const CapturePhoto = ({ onPhotoTaken }) => {
  const videoRef = useRef(null);
  const [photo, setPhoto] = useState(null);

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => console.error('Error accessing camera:', err));
  };

  const takePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const photoData = canvas.toDataURL('image/png');
    setPhoto(photoData);
    onPhotoTaken(photoData);  // Pass the photo data to parent component
  };

  return (
    <div>
      <video ref={videoRef} autoPlay width="300" height="200" />
      <button onClick={startCamera}>Start Camera</button>
      <button onClick={takePhoto}>Take Photo</button>
      {photo && <img src={photo} alt="Player Photo" />}
    </div>
  );
};
