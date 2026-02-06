import { Link } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { isVisionOCRAvailable } from '../../src/native/VisionOCR';
import { DrawingCanvas, DrawingPath } from '../../src/ui/components/DrawingCanvas';
import { InkChooser } from '../../src/ui/components/InkChooser';

export default function HandwritingTestScreen() {
  const [recognizedDigit, setRecognizedDigit] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [showInkChooser, setShowInkChooser] = useState(false);
  const [candidates, setCandidates] = useState<Array<{ digit: number; confidence: number }>>([]);
  
  const [drawKey, setDrawKey] = useState(0); // To reset canvas
  
  const handleDrawingComplete = useCallback(async (newPaths: DrawingPath[]) => {
    setPaths(newPaths);
  }, []);
  
  const handleRecognize = useCallback(async () => {
    if (paths.length === 0) {
      Alert.alert('No Drawing', 'Please draw a digit first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (!isVisionOCRAvailable()) {
        // Mock result for testing without native module
        Alert.alert(
          'Vision OCR Not Available',
          'Running in Expo Go - native module not loaded.\n\nTo test handwriting recognition:\n1. Run: eas build -p ios --profile development\n2. Install the dev build on your iPad\n3. Connect with: npx expo start --dev-client'
        );
        setRecognizedDigit('?');
        setConfidence(0);
        setIsProcessing(false);
        return;
      }
      
      // Note: In production with native build, you would convert paths to image here
      // For now, just show a placeholder since we can't create images without Skia
      Alert.alert('Native Build Required', 'Image conversion requires native Skia module.');
      setRecognizedDigit('?');
      setConfidence(0);
      
    } catch (error) {
      console.error('Recognition error:', error);
      Alert.alert('Error', 'Recognition failed: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [paths]);
  
  const handleClear = useCallback(() => {
    setDrawKey(k => k + 1);
    setPaths([]);
    setRecognizedDigit(null);
    setConfidence(0);
  }, []);
  
  const handleInkSelect = useCallback((digit: number) => {
    setRecognizedDigit(digit.toString());
    setShowInkChooser(false);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Link href="/" style={styles.backLink}>
          <Text style={styles.backText}>← Back</Text>
        </Link>
        <Text style={styles.title}>Handwriting Test</Text>
      </View>
      
      <Text style={styles.instructions}>
        Draw a digit (1-9) in the box below
      </Text>
      
      {/* Drawing Area */}
      <View style={styles.canvasWrapper}>
        <DrawingCanvas
          key={drawKey}
          size={280}
          strokeColor="#1a1a2e"
          strokeWidth={4}
          onDrawingComplete={handleDrawingComplete}
        />
      </View>
      
      {/* Result Display */}
      <View style={styles.resultContainer}>
        {recognizedDigit !== null ? (
          <>
            <Text style={styles.resultLabel}>Recognized:</Text>
            <Text style={styles.resultDigit}>{recognizedDigit}</Text>
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(confidence * 100)}%
            </Text>
          </>
        ) : (
          <Text style={styles.resultPlaceholder}>
            Draw a digit and tap "Recognize"
          </Text>
        )}
      </View>
      
      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.clearButton]}
          onPress={handleClear}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </Pressable>
        
        <Pressable
          style={[styles.button, styles.recognizeButton, isProcessing && styles.disabledButton]}
          onPress={handleRecognize}
          disabled={isProcessing}
        >
          <Text style={styles.recognizeButtonText}>
            {isProcessing ? 'Processing...' : 'Recognize'}
          </Text>
        </Pressable>
      </View>
      
      {/* Module Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Vision OCR: {isVisionOCRAvailable() ? '✅ Available' : '❌ Not available (need native build)'}
        </Text>
      </View>
      
      {/* Ink Chooser Modal */}
      <InkChooser
        visible={showInkChooser}
        candidates={candidates}
        onSelect={handleInkSelect}
        onDismiss={() => setShowInkChooser(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backLink: {
    paddingRight: 16,
  },
  backText: {
    fontSize: 16,
    color: '#2563eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  instructions: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  canvasWrapper: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    minHeight: 120,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultDigit: {
    fontSize: 72,
    fontWeight: '700',
    color: '#1e40af',
    marginVertical: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  recognizeButton: {
    backgroundColor: '#1e40af',
  },
  recognizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statusText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
