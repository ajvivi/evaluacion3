// Modelo oficial HairSegmenter: 0 fondo, 1 cabello. Todo se ejecuta localmente.
let detector;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      const { ImageSegmenter, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
      const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
      detector = await ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/1/hair_segmenter.tflite', delegate: 'CPU' },
        runningMode: 'VIDEO', outputCategoryMask: false, outputConfidenceMasks: true
      });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'frame') {
      try {
        detector.segmentForVideo(data.bitmap, data.timestamp, result => {
          const mask = result.confidenceMasks?.[1];
          if (!mask) throw new Error('El modelo no entregó la máscara de cabello.');
          const scores = new Float32Array(mask.getAsFloat32Array());
          self.postMessage({ type: 'mask', width: mask.width, height: mask.height, scores: scores.buffer }, [scores.buffer]);
        });
      } finally { data.bitmap.close(); }
    }
  } catch (error) { self.postMessage({ type: 'error', message: String(error.message || error) }); }
};
