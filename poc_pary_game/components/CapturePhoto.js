import { useState, useRef } from 'react';
export const CapturePhoto = ({ onPhotoTaken }) => {
  const videoRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [gameAsset, setGameAsset] = useState(null);  // State to store game asset

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => console.error('Error accessing camera:', err));
  };

  const takePhoto = () => {
    const canvas = document.createElement('canvas');
  
    // Set lower resolution (e.g., 150x100)
    canvas.width = 150;  // Lower width
    canvas.height = 100; // Lower height
  
    // Draw the video frame onto the canvas at the lower resolution
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
    // Convert the canvas to a base64 string in JPEG format
    const photoData = canvas.toDataURL('image/jpeg', 0.8);  // 0.8 is the quality factor (optional)
  
    setPhoto(photoData);
    onPhotoTaken(photoData);
  
    // Send the resized photo to the server or for further processing
    
  };

  return (
    <div>
      <video ref={videoRef} autoPlay width="300" height="200" />
      <button onClick={startCamera}>Start Camera</button>
      <button onClick={takePhoto}>Take Photo</button>
      {gameAsset ? (
        <img src={gameAsset} alt="Game Asset" width="50" />
      ) : (
        photo && <img src={photo} alt="Player Photo" width="50" />
      )}
    </div>
  );
};
