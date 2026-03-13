/**
 * Mock DICOM study metadata endpoint
 * GET /api/dicom/:jobId
 *
 * Returns mock study metadata for a given job, including per-sequence
 * image URLs that the mobile viewer can load individually.
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;

  // CORS headers so the mobile WebView can fetch cross-origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

  const sequences = ['T1', 'T2', 'FLAIR', 'T1C'];
  const totalSlices = 20;

  const study = {
    jobId,
    patientId: `PAT-${jobId.slice(-6).toUpperCase()}`,
    studyType: 'MRI Brain',
    studyDate: new Date().toISOString().split('T')[0],
    institution: 'Pixelence Clinical Centre',
    sequences: sequences.map((name) => ({
      name,
      totalSlices,
      slices: Array.from({ length: totalSlices }, (_, i) => ({
        index: i + 1,
        imageUrl: `${baseUrl}/api/dicom/${jobId}/image?sequence=${name}&slice=${i + 1}`,
      })),
    })),
  };

  res.status(200).json(study);
}
