import mediapipe as mp
import cv2
import numpy as np

class MediaPipeLandmarkExtractor:
    def __init__(self):
        self.mp_holistic = mp.solutions.holistic
        self.holistic = self.mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def extract_landmarks(self, frame):
        """
        Extract landmarks from a single frame.
        Returns: numpy array of shape (258,)
        """
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.holistic.process(frame_rgb)
        
        landmarks = []
        
        # Pose landmarks (33 points)
        if results.pose_landmarks:
            for lm in results.pose_landmarks.landmark:
                landmarks.extend([lm.x, lm.y, lm.z, lm.visibility])
        else:
            landmarks.extend([0] * 132)  # 33 × 4
        
        # Left hand (21 points)
        if results.left_hand_landmarks:
            for lm in results.left_hand_landmarks.landmark:
                landmarks.extend([lm.x, lm.y, lm.z])
        else:
            landmarks.extend([0] * 63)  # 21 × 3
        
        # Right hand (21 points)
        if results.right_hand_landmarks:
            for lm in results.right_hand_landmarks.landmark:
                landmarks.extend([lm.x, lm.y, lm.z])
        else:
            landmarks.extend([0] * 63)  # 21 × 3
        
        return np.array(landmarks)
    
    def extract_sequence(self, video_frames):
        """
        Extract landmarks from a sequence of frames.
        """
        sequence = []
        for frame in video_frames:
            landmarks = self.extract_landmarks(frame)
            sequence.append(landmarks)
        return np.array(sequence)
