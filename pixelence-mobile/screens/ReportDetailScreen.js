import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';

import { api } from '@pixelence/convex';

// ── Client-side brain SVG generator (no server required) ─────────────────────
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function toHex(val) { return Math.min(255, Math.max(0, Math.round(val))).toString(16).padStart(2, '0'); }
function grey(val) { const h = toHex(val); return `#${h}${h}${h}`; }
const SEQ_PARAMS = {
  T1:    { brightness: 160, contrast: 0.85, label: 'T1-weighted',  accent: '#A0A0A0' },
  T2:    { brightness: 210, contrast: 0.60, label: 'T2-weighted',  accent: '#C8C8C8' },
  FLAIR: { brightness: 130, contrast: 1.10, label: 'FLAIR',        accent: '#888888' },
};
function makeBrainSvg(sequence, slice = 10, jobId = 'DEMO') {
  const p = SEQ_PARAMS[sequence] || SEQ_PARAMS.T1;
  const { brightness, contrast, label, accent } = p;
  const totalSlices = 20;
  const pos = (slice - 1) / (totalSlices - 1 || 1);
  const radX = Math.round(140 * Math.sin(Math.PI * pos) + 20);
  const radY = Math.round(170 * Math.sin(Math.PI * pos) + 15);
  const rng  = seededRandom(slice * 31 + sequence.charCodeAt(0) * 7);
  const skullVal = Math.round(brightness * 0.4 * contrast);
  const brainVal = Math.round(brightness * 0.72 * contrast);
  const wmVal    = Math.round(brightness * 0.90 * contrast);
  const ventVal  = Math.round(brightness * 0.15 * contrast);
  const gyri = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + rng() * 0.5;
    const dist  = 40 + rng() * 70;
    const gx    = 256 + Math.cos(angle) * dist;
    const gy    = 256 + Math.sin(angle) * dist * 1.1;
    const gr    = 18 + rng() * 28;
    const gVal  = Math.round(wmVal * (0.85 + rng() * 0.3));
    return `<ellipse cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" rx="${gr.toFixed(1)}" ry="${(gr * 0.75).toFixed(1)}" fill="${grey(gVal)}" opacity="0.7"/>`;
  });
  const showVent = pos > 0.3 && pos < 0.75;
  const ventSvg = showVent
    ? `<ellipse cx="240" cy="248" rx="18" ry="10" fill="${grey(ventVal)}"/><ellipse cx="272" cy="248" rx="18" ry="10" fill="${grey(ventVal)}"/><rect x="240" y="243" width="32" height="10" fill="${grey(ventVal)}"/>`
    : '';
  const falxSvg = pos > 0.2 && pos < 0.85
    ? `<line x1="256" y1="${(256 - radY * 0.9).toFixed(0)}" x2="256" y2="${(256 + radY * 0.9).toFixed(0)}" stroke="${grey(ventVal)}" stroke-width="3" opacity="0.5"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${grey(18)}"/>
  <ellipse cx="256" cy="256" rx="${radX + 26}" ry="${radY + 22}" fill="${grey(skullVal)}" stroke="${grey(skullVal + 20)}" stroke-width="2"/>
  <ellipse cx="256" cy="256" rx="${radX}" ry="${radY}" fill="${grey(brainVal)}"/>
  ${gyri.join('\n  ')}${falxSvg}${ventSvg}
  <rect x="6" y="468" width="140" height="22" rx="3" fill="rgba(0,0,0,0.6)"/>
  <text x="12" y="483" font-family="monospace" font-size="12" font-weight="bold" fill="${accent}">${label}</text>
  <rect x="496" y="0" width="8" height="512" fill="rgba(0,0,0,0.4)"/>
  <rect x="496" y="${Math.round(pos * 512)}" width="8" height="24" rx="2" fill="${accent}"/></svg>`;
}
function makeThumbnailHtml(sequence, slice, jobId) {
  const svg = makeBrainSvg(sequence, slice, jobId);
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>*{margin:0;padding:0}html,body{width:100%;height:100%;background:#000;overflow:hidden}svg{width:100%;height:100%}</style></head><body>${svg}</body></html>`;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportDetailScreen({ route, navigation }) {
  const { reportId } = route.params;
  const [report, setReport] = useState(undefined);

  useEffect(() => {
    api.reports.getReportById({ reportId })
      .then(data => setReport(data))
      .catch(() => setReport(null));
  }, [reportId]);

  if (report === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (report === null) {
      return (
          <View style={styles.center}>
              <Text>Report not found</Text>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report Results</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Patient Summary Card */}
        <View style={styles.patientCard}>
          <Text style={styles.patientName}>Patient ID: {report.patientId}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Status ID: {report.status}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Study Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Information</Text>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Job ID</Text>
              <Text style={styles.infoValue}>{report.jobId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Report Date</Text>
              <Text style={styles.infoValue}>{new Date(report.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Radiologist</Text>
              <Text style={styles.infoValue}>{report.radiologistId}</Text>
            </View>
          </View>
        </View>

        {/* Findings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Findings</Text>
          <View style={styles.contentBox}>
            <Text style={styles.contentText}>{report.findings}</Text>
          </View>
        </View>

        {/* Impression */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impression</Text>
          <View style={[styles.contentBox, styles.highlightBox]}>
            <Text style={styles.contentText}>{report.impression}</Text>
          </View>
        </View>

        {/* Medical Imaging Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Imaging</Text>
          <View style={styles.imagingBox}>
            <View style={styles.imageThumbnails}>
              {['T1', 'T2', 'FLAIR'].map((seq, idx) => {
                const dicomId = report.jobId || reportId;
                return (
                  <View key={idx} style={styles.imagePreview}>
                    <WebView
                      source={{ html: makeThumbnailHtml(seq, 10, dicomId) }}
                      style={styles.thumbWebView}
                      scrollEnabled={false}
                      originWhitelist={['*']}
                    />
                    <View style={styles.thumbLabel} pointerEvents="none">
                      <Text style={styles.previewText}>{seq}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.viewImagesButton}
              onPress={() => navigation.navigate('DicomViewer', { jobId: report.jobId || reportId })}
            >
              <Text style={styles.viewImagesText}>Open Full DICOM Viewer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Actions */}
        <TouchableOpacity style={styles.printButton}>
          <Text style={styles.printButtonText}>Download PDF Report</Text>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          Digital report generated by Pixelence MRI System. This report should be reviewed with your primary physician.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
  },
  patientCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 25,
    marginBottom: 25,
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  infoValue: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 14,
  },
  contentBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highlightBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  contentText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  imagingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageThumbnails: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  imagePreview: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  previewText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  viewImagesButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  viewImagesText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 14,
  },
  printButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  }
});
