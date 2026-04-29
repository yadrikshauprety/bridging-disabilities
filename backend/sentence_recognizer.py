import tensorflow as tf
import numpy as np

class ASLSentenceRecognizer:
    def __init__(self, model_path='asl_lstm_lite.tflite'):
        # Load TFLite model
        self.interpreter = tf.lite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()
        
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        
        # Vocabulary (common interview sentences)
        self.sentences = [
            "Hello, my name is",
            "I have experience in",
            "My strength is",
            "My weakness is", 
            "I want to work here because",
            "I can start immediately",
            "Thank you for the opportunity",
            "I have a degree in",
            "I worked at company for years",
            "I am good at teamwork",
            "I can learn quickly",
            "My goal is to",
            "I am passionate about",
            "I have skills in",
            "I am looking for",
            "I can contribute by",
            "I solved a problem by",
            "I led a team of",
            "I improved process by",
            "I achieved results by"
        ]
        
    def recognize(self, landmark_sequence):
        """
        Input: (num_frames, 258) - sequence of MediaPipe landmarks
        Output: predicted sentence + confidence
        """
        # Pad/trim to fixed length (64 frames = ~6 seconds)
        max_frames = 64
        
        # Convert to numpy if not already
        landmark_sequence = np.array(landmark_sequence)
        
        if len(landmark_sequence) == 0:
             return {'sentence': "No gesture detected", 'confidence': 0.0}
             
        if len(landmark_sequence) < max_frames:
            # Pad with zeros
            padding = np.zeros((max_frames - len(landmark_sequence), 258))
            landmark_sequence = np.vstack([landmark_sequence, padding])
        else:
            # Trim
            landmark_sequence = landmark_sequence[:max_frames]
        
        # Reshape for model: (1, 64, 258)
        input_data = np.expand_dims(landmark_sequence, axis=0).astype(np.float32)
        
        # Run inference
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        self.interpreter.invoke()
        
        # Get output
        output = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        
        # Get top prediction
        pred_idx = np.argmax(output)
        confidence = output[pred_idx]
        
        return {
            'sentence': self.sentences[pred_idx],
            'confidence': float(confidence * 100)
        }
