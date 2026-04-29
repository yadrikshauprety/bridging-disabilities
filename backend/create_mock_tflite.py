import tensorflow as tf
import numpy as np
import os

def create_dummy_model():
    # Input shape: (batch, 64 frames, 258 landmarks)
    inputs = tf.keras.Input(shape=(64, 258))
    
    # Flatten and Simple Dense layer instead of LSTM to avoid TensorList issues in dummy
    x = tf.keras.layers.Flatten()(inputs)
    x = tf.keras.layers.Dense(64, activation='relu')(x)
    
    # Output: 20 classes (sentences)
    outputs = tf.keras.layers.Dense(20, activation='softmax')(x)
    
    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    # Save as tflite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    
    with open('asl_lstm_lite.tflite', 'wb') as f:
        f.write(tflite_model)
        
    print("Created mock asl_lstm_lite.tflite model")

if __name__ == "__main__":
    create_dummy_model()
