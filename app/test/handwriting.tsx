import { Link } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {
  getRecognizerDisplayName,
  isRecognizerAvailable,
  recognizeDigit,
  type RecognitionResult
} from '../../src/recognition';
import { DrawingCanvas, DrawingPath } from '../../src/ui/components/DrawingCanvas';
import { InkChooser } from '../../src/ui/components/InkChooser';
import { getDrawingRenderer } from '../../src/utils/skiaDetection';

const CANVAS_SIZE = 280;

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
    
    if (!isRecognizerAvailable()) {
      Alert.alert('No Recognizer', 'No digit recognizer is available');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result: RecognitionResult = await recognizeDigit(paths, CANVAS_SIZE);
      
      setRecognizedDigit(result.digit.toString());
      setConfidence(result.confidence);
      setCandidates(result.allCandidates);
      
      // Show ink chooser if confidence is low or for alternative options
      if (result.confidence < 0.7 && result.allCandidates.length > 1) {
        setShowInkChooser(true);
      }
      
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
    setCandidates([]);
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
          size={CANVAS_SIZE}
          strokeColor="#1a1a2e"
          strokeWidth={8}
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
            {candidates.length > 1 && (
              <Pressable onPress={() => setShowInkChooser(true)}>
                <Text style={styles.alternativesLink}>
                  See alternatives
                </Text>
              </Pressable>
            )}
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
          Recognition: {getRecognizerDisplayName()}
        </Text>
        <Text style={styles.statusText}>
          Drawing: {getDrawingRenderer() === 'skia' ? '✅ Skia (native)' : '📝 SVG (fallback)'}
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
  alternativesLink: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 8,
    textDecorationLine: 'underline',
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
