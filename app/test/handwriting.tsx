import { Link } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, SafeAreaView, Text, View } from 'react-native';
import {
  getRecognizerDisplayName,
  isRecognizerAvailable,
  recognizeDigit,
  type RecognitionResult,
} from '../../src/recognition';
import {
  DrawingCanvas,
  DrawingPath,
} from '../../src/ui/components/DrawingCanvas';
import { InkChooser } from '../../src/ui/components/InkChooser';
import { getDrawingRenderer } from '../../src/utils/skiaDetection';

const CANVAS_SIZE = 280;

export default function HandwritingTestScreen() {
  const [recognizedDigit, setRecognizedDigit] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [showInkChooser, setShowInkChooser] = useState(false);
  const [candidates, setCandidates] = useState<
    Array<{ digit: number; confidence: number }>
  >([]);

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
      const result: RecognitionResult = await recognizeDigit(
        paths,
        CANVAS_SIZE
      );

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
    setDrawKey((k) => k + 1);
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
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center px-4 py-3">
        <Link href="/" className="pr-4">
          <Text className="text-base text-blue-600">← Back</Text>
        </Link>
        <Text className="text-xl font-bold text-gray-800">
          Handwriting Test
        </Text>
      </View>

      <Text className="my-4 text-center text-base text-gray-500">
        Draw a digit (1-9) in the box below
      </Text>

      {/* Drawing Area */}
      <View className="items-center py-4">
        <DrawingCanvas
          key={drawKey}
          size={CANVAS_SIZE}
          strokeColor="#1a1a2e"
          strokeWidth={8}
          onDrawingComplete={handleDrawingComplete}
        />
      </View>

      {/* Result Display */}
      <View className="min-h-[120px] items-center py-6">
        {recognizedDigit !== null ? (
          <>
            <Text className="text-sm text-gray-500">Recognized:</Text>
            <Text className="my-2 text-7xl font-bold text-blue-800">
              {recognizedDigit}
            </Text>
            <Text className="text-sm text-gray-500">
              Confidence: {Math.round(confidence * 100)}%
            </Text>
            {candidates.length > 1 && (
              <Pressable onPress={() => setShowInkChooser(true)}>
                <Text className="mt-2 text-sm text-blue-600 underline">
                  See alternatives
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          <Text className="text-sm italic text-gray-400">
            Draw a digit and tap "Recognize"
          </Text>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row justify-center gap-4 py-4">
        <Pressable
          className="rounded-3xl bg-gray-100 px-8 py-3.5"
          onPress={handleClear}
        >
          <Text className="text-base font-semibold text-gray-600">Clear</Text>
        </Pressable>

        <Pressable
          className={`rounded-3xl bg-blue-800 px-8 py-3.5 ${isProcessing ? 'opacity-60' : ''}`}
          onPress={handleRecognize}
          disabled={isProcessing}
        >
          <Text className="text-base font-semibold text-white">
            {isProcessing ? 'Processing...' : 'Recognize'}
          </Text>
        </Pressable>
      </View>

      {/* Module Status */}
      <View className="items-center py-6">
        <Text className="text-xs text-gray-400">
          Recognition: {getRecognizerDisplayName()}
        </Text>
        <Text className="text-xs text-gray-400">
          Drawing:{' '}
          {getDrawingRenderer() === 'skia'
            ? '✅ Skia (native)'
            : '📝 SVG (fallback)'}
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
