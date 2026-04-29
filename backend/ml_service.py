import sys
import json
import numpy as np
from sentence_recognizer import ASLSentenceRecognizer

def convert_frontend_landmarks_to_holistic(frontend_sequence):
    """
    Frontend sends sequence of 21-point hand arrays.
    Holistic expects 258 features:
      0-131: Pose
      132-194: Left Hand (63)
      195-257: Right Hand (63)
    """
    seq = []
    for frame_hand in frontend_sequence:
        features = np.zeros(258, dtype=np.float32)
        if frame_hand and len(frame_hand) == 21:
            hand_features = []
            for p in frame_hand:
                hand_features.extend([p.get('x', 0), p.get('y', 0), p.get('z', 0)])
            # Let's map it to the right hand slot (index 195)
            features[195:258] = hand_features
        seq.append(features)
    return np.array(seq)

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input data"}))
            sys.exit(1)
            
        data = json.loads(input_data)
        frontend_landmarks = data.get("landmarks", [])
        
        # Transform frontend format to holistic expected format
        holistic_sequence = convert_frontend_landmarks_to_holistic(frontend_landmarks)
        
        recognizer = ASLSentenceRecognizer()
        result = recognizer.recognize(holistic_sequence)
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
