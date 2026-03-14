import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_SEQUENCES = [
  { name: 'T1',    totalSlices: 20 },
  { name: 'T2',    totalSlices: 20 },
  { name: 'FLAIR', totalSlices: 20 },
  { name: 'T1C',   totalSlices: 20 },
];

// SVG brain generator embedded verbatim in the WebView HTML.
// Must NOT contain backtick characters (it is interpolated into an outer template literal).
const SVG_GEN_JS = `
var SEQ={
  T1:   {brightness:160,contrast:0.85,label:'T1-weighted', accent:'#A0A0A0'},
  T2:   {brightness:210,contrast:0.60,label:'T2-weighted', accent:'#C8C8C8'},
  FLAIR:{brightness:130,contrast:1.10,label:'FLAIR',        accent:'#888888'},
  T1C:  {brightness:180,contrast:0.95,label:'T1 Contrast',  accent:'#B0B8C0'}
};
function rng(seed){var s=seed;return function(){s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0xffffffff;};}
function hex(v){return Math.min(255,Math.max(0,Math.round(v))).toString(16).padStart(2,'0');}
function grey(v){var h=hex(v);return '#'+h+h+h;}
function makeSvg(seq,sl,jobId){
  var p=SEQ[seq]||SEQ['T1'],b=p.brightness,c=p.contrast,lbl=p.label,acc=p.accent;
  var N=20,pos=sl>1?(sl-1)/(N-1):0;
  var rx=Math.round(140*Math.sin(Math.PI*pos)+20),ry=Math.round(170*Math.sin(Math.PI*pos)+15);
  var r=rng(sl*31+seq.charCodeAt(0)*7);
  var sk=Math.round(b*0.4*c),br=Math.round(b*0.72*c),wm=Math.round(b*0.90*c),ve=Math.round(b*0.15*c);
  var g='';
  for(var i=0;i<6;i++){
    var a=(i/6)*Math.PI*2+r()*0.5,d=40+r()*70;
    var gx=(256+Math.cos(a)*d).toFixed(1),gy=(256+Math.sin(a)*d*1.1).toFixed(1),gr=18+r()*28;
    var gv=Math.round(wm*(0.85+r()*0.3));
    g+='<ellipse cx="'+gx+'" cy="'+gy+'" rx="'+gr.toFixed(1)+'" ry="'+(gr*0.75).toFixed(1)+'" fill="'+grey(gv)+'" opacity="0.7"/>';
  }
  var vnt=(pos>0.3&&pos<0.75)
    ?'<ellipse cx="240" cy="248" rx="18" ry="10" fill="'+grey(ve)+'"/><ellipse cx="272" cy="248" rx="18" ry="10" fill="'+grey(ve)+'"/><rect x="240" y="243" width="32" height="10" fill="'+grey(ve)+'"/>'
    :'';
  var flx=(pos>0.2&&pos<0.85)
    ?'<line x1="256" y1="'+(256-ry*0.9).toFixed(0)+'" x2="256" y2="'+(256+ry*0.9).toFixed(0)+'" stroke="'+grey(ve)+'" stroke-width="3" opacity="0.5"/>'
    :'';
  var now=new Date(),ds=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  var jl=((jobId||'DEMO')+'').slice(0,16).toUpperCase();
  return '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">'
    +'<rect width="512" height="512" fill="'+grey(18)+'"/>'
    +'<ellipse cx="256" cy="256" rx="'+(rx+26)+'" ry="'+(ry+22)+'" fill="'+grey(sk)+'" stroke="'+grey(sk+20)+'" stroke-width="2"/>'
    +'<ellipse cx="256" cy="256" rx="'+rx+'" ry="'+ry+'" fill="'+grey(br)+'"/>'
    +g+flx+vnt
    +'<rect x="0" y="0" width="512" height="28" fill="rgba(0,0,0,0.55)"/>'
    +'<text x="8" y="18" font-family="monospace" font-size="11" fill="'+acc+'">PIXELENCE CLINICAL VIEWER</text>'
    +'<text x="330" y="18" font-family="monospace" font-size="11" fill="'+acc+'">'+ds+'</text>'
    +'<text x="8" y="500" font-family="monospace" font-size="11" fill="'+acc+'">JOB: '+jl+'</text>'
    +'<text x="330" y="500" font-family="monospace" font-size="11" fill="'+acc+'">SL: '+sl+'/'+N+'</text>'
    +'<rect x="6" y="468" width="140" height="22" rx="3" fill="rgba(0,0,0,0.6)"/>'
    +'<text x="12" y="483" font-family="monospace" font-size="12" font-weight="bold" fill="'+acc+'">'+lbl+'</text>'
    +'<rect x="496" y="0" width="8" height="512" fill="rgba(0,0,0,0.4)"/>'
    +'<rect x="496" y="'+Math.round(pos*512)+'" width="8" height="24" rx="2" fill="'+acc+'"/>'
    +'</svg>';
}`;

export default function DicomViewerScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [activeSeq, setActiveSeq] = useState(0);
  const [slice, setSlice]         = useState(1);
  const webViewRef                 = useRef(null);

  const sequences   = DEFAULT_SEQUENCES;
  const currentSeq  = sequences[activeSeq];
  const totalSlices = currentSeq.totalSlices;

  // Built once per jobId — SVG is generated inside the WebView via JS, updated via postMessage.
  const htmlContent = useMemo(() => `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#000;display:flex;flex-direction:column;height:100vh;overflow:hidden;font-family:system-ui;color:#fff}
    #viewer{flex:1;display:flex;align-items:center;justify-content:center;background:#000}
    #viewer svg{max-width:100%;max-height:100%}
    #bar{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:4px 14px;font-size:11px;color:#ccc;font-family:monospace;white-space:nowrap}
  </style>
</head><body>
  <div id="viewer"></div>
  <div id="bar">T1 | SL 1 / 20</div>
  <script>
    ${SVG_GEN_JS}
    var viewer=document.getElementById('viewer'),bar=document.getElementById('bar');
    var state={seq:'T1',sl:1,total:20,jobId:'${jobId || 'DEMO'}'};
    function render(d){
      if(d) state=Object.assign({},state,d);
      viewer.innerHTML=makeSvg(state.seq,state.sl,state.jobId);
      bar.textContent=state.seq+' | SL '+state.sl+' / '+state.total;
    }
    document.addEventListener('message',function(e){try{render(JSON.parse(e.data));}catch(x){}});
    window.addEventListener('message',function(e){try{render(JSON.parse(e.data));}catch(x){}});
    render();
  </script>
</body></html>`, [jobId]);

  const sendToWebView = (newSlice, newSeqIdx) => {
    const seq = sequences[newSeqIdx] || currentSeq;
    webViewRef.current?.postMessage(
      JSON.stringify({ seq: seq.name, sl: newSlice, total: seq.totalSlices })
    );
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Clinical Image Viewer</Text>
        <Text style={styles.shareText}>MRI</Text>
      </View>

      <View style={styles.viewerContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled
          mixedContentMode="always"
        />
      </View>

      <View style={styles.controls}>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Job: {(jobId || 'DEMO').slice(0, 12).toUpperCase()}</Text>
          <Text style={styles.infoText}>Slice {slice}/{totalSlices}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.controlButton} onPress={handlePrevSlice}>
            <Text style={styles.buttonText}>◀ Prev Slice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.primaryButton]} onPress={handleNextSlice}>
            <Text style={styles.primaryButtonText}>Next Slice ▶</Text>
          </TouchableOpacity>
        </View>

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
