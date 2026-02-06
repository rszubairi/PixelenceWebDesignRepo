"""
ML Processing Service
Handles DICOM image processing with TensorFlow/Keras models
"""
import asyncio
import os
import time
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import tensorflow as tf
import pydicom
from PIL import Image
import cv2
from sklearn.preprocessing import StandardScaler
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


class MLProcessor:
    """ML processing service for DICOM images"""

    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_warmed_up = False
        self.gpu_available = tf.config.list_physical_devices('GPU')

        # Configure GPU memory growth
        if self.gpu_available:
            try:
                for gpu in self.gpu_available:
                    tf.config.experimental.set_memory_growth(gpu, True)
                tf.config.set_logical_device_configuration(
                    self.gpu_available[0],
                    [tf.config.LogicalDeviceConfiguration(memory_limit=int(settings.GPU_MEMORY_LIMIT * 1024))]
                )
                logger.info("GPU configured", gpu_count=len(self.gpu_available))
            except Exception as e:
                logger.warning("Failed to configure GPU", error=str(e))

    async def warm_up(self):
        """Warm up the ML models"""
        try:
            logger.info("Warming up ML models")

            # Load or create model
            await self._load_model()

            # Create sample input for warm-up
            sample_input = np.random.rand(1, 256, 256, 1).astype(np.float32)

            # Run inference to warm up
            _ = self.model.predict(sample_input, verbose=0)

            self.is_warmed_up = True
            logger.info("ML models warmed up successfully")

        except Exception as e:
            logger.error("Failed to warm up ML models", error=str(e))
            raise

    async def _load_model(self):
        """Load the TensorFlow/Keras model"""
        model_path = os.path.join(settings.MODEL_PATH, f"dicom_processor_{settings.MODEL_VERSION}")

        if os.path.exists(model_path):
            # Load existing model
            self.model = tf.keras.models.load_model(model_path)
            logger.info("Loaded existing model", path=model_path)
        else:
            # Create new model for demo purposes
            await self._create_demo_model()
            logger.info("Created demo model")

        # Load or create scaler
        scaler_path = os.path.join(settings.MODEL_PATH, "scaler.pkl")
        if os.path.exists(scaler_path):
            # In production, load with joblib
            self.scaler = StandardScaler()
        else:
            self.scaler = StandardScaler()

    async def _create_demo_model(self):
        """Create a demo CNN model for DICOM processing"""
        self.model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(256, 256, 1)),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dense(3, activation='softmax')  # 3 classes: normal, abnormal, enhanced
        ])

        self.model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        logger.info("Demo model created", architecture=self.model.summary())

    async def process_dicom_files(self, file_paths: List[str], job_id: str) -> Dict[str, Any]:
        """Process multiple DICOM files"""
        start_time = time.time()
        results = []

        try:
            for file_path in file_paths:
                result = await self._process_single_dicom(file_path)
                results.append(result)

            # Aggregate results
            aggregated = self._aggregate_results(results)

            processing_time = time.time() - start_time
            logger.info("DICOM processing completed",
                       job_id=job_id,
                       files_processed=len(file_paths),
                       processing_time=f"{processing_time:.2f}s")

            return {
                "job_id": job_id,
                "status": "completed",
                "results": aggregated,
                "processing_time": processing_time,
                "file_count": len(file_paths)
            }

        except Exception as e:
            logger.error("DICOM processing failed", job_id=job_id, error=str(e))
            raise

    async def _process_single_dicom(self, file_path: str) -> Dict[str, Any]:
        """Process a single DICOM file"""
        try:
            # Read DICOM file
            dicom = pydicom.dcmread(file_path)

            # Extract pixel data
            pixel_array = dicom.pixel_array

            # Preprocess image
            processed_image = self._preprocess_image(pixel_array)

            # Run ML inference
            predictions = self.model.predict(processed_image, verbose=0)

            # Post-process results
            result = self._postprocess_predictions(predictions[0])

            return {
                "file_path": file_path,
                "patient_id": getattr(dicom, 'PatientID', 'Unknown'),
                "study_instance_uid": getattr(dicom, 'StudyInstanceUID', 'Unknown'),
                "series_instance_uid": getattr(dicom, 'SeriesInstanceUID', 'Unknown'),
                "modality": getattr(dicom, 'Modality', 'Unknown'),
                "predictions": result,
                "confidence": float(np.max(predictions[0]))
            }

        except Exception as e:
            logger.error("Failed to process DICOM file", file_path=file_path, error=str(e))
            return {
                "file_path": file_path,
                "error": str(e),
                "status": "failed"
            }

    def _preprocess_image(self, pixel_array: np.ndarray) -> np.ndarray:
        """Preprocess DICOM pixel array for ML model"""
        # Convert to float32
        image = pixel_array.astype(np.float32)

        # Normalize to 0-1 range
        image = (image - np.min(image)) / (np.max(image) - np.min(image) + 1e-8)

        # Resize to model input size
        image = cv2.resize(image, (256, 256))

        # Add channel dimension
        image = np.expand_dims(image, axis=[0, -1])

        return image

    def _postprocess_predictions(self, predictions: np.ndarray) -> Dict[str, float]:
        """Convert model predictions to human-readable results"""
        class_names = ['normal', 'abnormal', 'enhanced']
        results = {}

        for i, class_name in enumerate(class_names):
            results[class_name] = float(predictions[i])

        # Determine primary finding
        max_idx = np.argmax(predictions)
        results['primary_finding'] = class_names[max_idx]
        results['confidence'] = float(predictions[max_idx])

        return results

    def _aggregate_results(self, results: List[Dict]) -> Dict[str, Any]:
        """Aggregate results from multiple files"""
        if not results:
            return {"error": "No results to aggregate"}

        # Filter out failed results
        successful_results = [r for r in results if 'error' not in r]

        if not successful_results:
            return {"error": "All files failed processing"}

        # Aggregate predictions
        aggregated = {
            "total_files": len(results),
            "successful_files": len(successful_results),
            "failed_files": len(results) - len(successful_results),
            "findings": []
        }

        # Group by primary finding
        finding_counts = {}
        for result in successful_results:
            finding = result['predictions']['primary_finding']
            finding_counts[finding] = finding_counts.get(finding, 0) + 1

        # Determine overall assessment
        most_common_finding = max(finding_counts, key=finding_counts.get)
        confidence = finding_counts[most_common_finding] / len(successful_results)

        aggregated["overall_assessment"] = {
            "primary_finding": most_common_finding,
            "confidence": confidence,
            "finding_distribution": finding_counts
        }

        # Add individual file results
        aggregated["file_results"] = successful_results

        return aggregated

    async def cleanup(self):
        """Cleanup resources"""
        if self.model:
            # Clear Keras session
            tf.keras.backend.clear_session()
            logger.info("ML processor cleaned up")

    def is_model_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None

    def get_gpu_memory_usage(self) -> Dict[str, Any]:
        """Get GPU memory usage information"""
        if not self.gpu_available:
            return {"gpu_available": False}

        try:
            # In production, you might use nvidia-ml-py3 for detailed GPU stats
            return {
                "gpu_available": True,
                "gpu_count": len(self.gpu_available),
                "memory_limit_mb": int(settings.GPU_MEMORY_LIMIT * 1024)
            }
        except Exception as e:
            logger.warning("Failed to get GPU stats", error=str(e))
            return {"gpu_available": True, "error": str(e)}
