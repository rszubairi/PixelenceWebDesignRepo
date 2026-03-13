import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { api } from '@pixelence/convex';

const { width } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export default function DicomViewerScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [job, setJob]       = useState(undefined);
  const [study, setStudy]   = useState(null);
  const [activeSeq, setActiveSeq] = useState(0);
  const [slice, setSlice]   = useState(1);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);

  // Fetch job metadata from Convex
  useEffect(() => {
    api.jobs.getJobById({ jobId })
      .then(data => setJob(data))
      .catch(() => setJob(null));
  }, [jobId]);

  // Fetch DICOM study metadata from the mock API
  useEffect(() => {
    fetch(`${API_BASE}/api/dicom/${jobId}`)
      .then(r => r.json())
      .then(data => { setStudy(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [jobId]);

  if (job === undefined || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Clinical Viewer...</Text>
      </View>
    );
  }

  if (job === null) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Job not found</Text>
      </View>
    );
  }

  const sequences    = study?.sequences || [{ name: 'T1', totalSlices: 20 }];
  const currentSeq   = sequences[activeSeq] || sequences[0];
  const totalSlices  = currentSeq?.totalSlices || 20;
  const imageUrl     = `${API_BASE}/api/dicom/${jobId}/image?sequence=${currentSeq.name}&slice=${slice}`;

  // Build the WebView HTML — loads the SVG image directly via <img> tag
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      font-family: -apple-system, system-ui;
      color: #fff;
    }
    #viewer {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    #dicom-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }
    #spinner {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      font-size: 13px;
      color: #94A3B8;
      letter-spacing: 1px;
    }
    #slice-bar {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.65);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 11px;
      color: #ccc;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="viewer">
    <div id="spinner">LOADING IMAGE...</div>
    <img id="dicom-img" src="" style="display:none"/>
    <div id="slice-bar">SL 1 / 20</div>
  </div>
  <script>
    const img      = document.getElementById('dicom-img');
    const spinner  = document.getElementById('spinner');
    const sliceBar = document.getElementById('slice-bar');
    let state = { url: '', seq: 'T1', slice: 1, total: 20 };

    function load(data) {
      state = { ...state, ...data };
      spinner.style.display = 'flex';
      img.style.display = 'none';
      img.src = state.url;
      sliceBar.textContent = state.seq + '  |  SL ' + state.slice + ' / ' + state.total;
    }

    img.onload  = () => { spinner.style.display = 'none'; img.style.display = 'block'; };
    img.onerror = () => { spinner.textContent = 'IMAGE LOAD ERROR'; };

    document.addEventListener('message', e => { try { load(JSON.parse(e.data)); } catch(_){} });
    window.addEventListener('message',   e => { try { load(JSON.parse(e.data)); } catch(_){} });

    // Initial load
    load({ url: '${imageUrl}', seq: '${currentSeq.name}', slice: ${slice}, total: ${totalSlices} });
  </script>
</body>
</html>`;

  const sendToWebView = (newSlice, newSeqIdx) => {
    const seq  = sequences[newSeqIdx] || currentSeq;
    const url  = `${API_BASE}/api/dicom/${jobId}/image?sequence=${seq.name}&slice=${newSlice}`;
    const msg  = JSON.stringify({ url, seq: seq.name, slice: newSlice, total: seq.totalSlices });
    webViewRef.current?.postMessage(msg);
  };

  const handleNextSlice = () => {
    const next = slice < totalSlices ? slice + 1 : 1;
    setSlice(next);
    sendToWebView(next, activeSeq);
  };

  const handlePrevSlice = () => {
    const prev = slice > 1 ? slice - 1 : totalSlices;
    setSlice(prev);
    sendToWebView(prev, activeSeq);
  };

  const handleSequenceChange = (idx) => {
    setActiveSeq(idx);
    setSlice(1);
    sendToWebView(1, idx);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Clinical Image Viewer</Text>
        <Text style={styles.shareText}>{job.studyType || 'MRI'}</Text>
      </View>

      {/* WebView image area */}
      <View style={styles.viewerContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
          mixedContentMode="always"
          allowUniversalAccessFromFileURLs
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Patient: {job.patientId}</Text>
          <Text style={styles.infoText}>
            Slice {slice}/{totalSlices}
          </Text>
        </View>

        {/* Slice navigation */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.controlButton} onPress={handlePrevSlice}>
            <Text style={styles.buttonText}>◀ Prev Slice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.primaryButton]} onPress={handleNextSlice}>
            <Text style={styles.primaryButtonText}>Next Slice ▶</Text>
          </TouchableOpacity>
        </View>

        {/* Sequence selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailStrip}>
          {sequences.map((seq, idx) => (
            <TouchableOpacity
              key={seq.name}
              style={[styles.thumbnail, activeSeq === idx && styles.thumbnailActive]}
              onPress={() => handleSequenceChange(idx)}
            >
              <Text style={[styles.thumbText, activeSeq === idx && styles.thumbTextActive]}>
                {seq.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000' },
  loadingText:     { color: '#94A3B8', marginTop: 12, fontSize: 13 },
  header: {
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButtonText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  title:           { color: '#fff', fontSize: 17, fontWeight: '700' },
  shareText:       { color: '#3B82F6', fontWeight: '600', fontSize: 13 },
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  webview:         { flex: 1, backgroundColor: 'transparent' },
  controls: {
    backgroundColor: '#111',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  buttonRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  controlButton: {
    flex: 1,
    backgroundColor: '#222',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton:   { backgroundColor: '#3B82F6' },
  buttonText:      { color: '#fff', fontWeight: '600' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  thumbnailStrip:  { paddingVertical: 4 },
  thumbnail: {
    marginRight: 8,
    width: 58,
    height: 44,
    backgroundColor: '#222',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  thumbnailActive: { borderColor: '#3B82F6', backgroundColor: '#1D3A5F' },
  thumbText:       { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  thumbTextActive: { color: '#3B82F6' },
});
