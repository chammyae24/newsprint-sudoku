/**
 * Pure JavaScript neural network for MNIST digit recognition.
 * Based on the mnist-expo implementation by enzomanuelmangano.
 * Uses pre-trained weights with 2 hidden layers.
 */

export interface NeuralNetworkWeights {
  inputLayerWeights: number[][];
  inputLayerBias: number[];
  hiddenLayerWeights: number[][];
  hiddenLayerBias: number[];
  outputLayerWeights: number[][];
  outputLayerBias: number[];
}

export interface PredictResult {
  hidden1Output: number[];
  hidden2Output: number[];
  finalOutput: number[];
  predictedClass: number;
  confidence: number;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function relu(x: number): number {
  return Math.max(0, x);
}

function softmax(arr: number[]): number[] {
  const maxVal = Math.max(...arr);
  const expValues = arr.map(x => Math.exp(x - maxVal));
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  return expValues.map(exp => exp / sumExp);
}

function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  const result = new Array(matrix[0].length).fill(0);
  for (let i = 0; i < matrix[0].length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      result[i] += matrix[j][i] * vector[j];
    }
  }
  return result;
}

/**
 * Run inference on a 28x28 input image.
 * @param weights Pre-trained model weights
 * @param input 28x28 matrix of pixel values (0 or 1 for binary, 0-1 for grayscale)
 * @returns Prediction result with class and confidence
 */
export function predictDigit(
  weights: NeuralNetworkWeights,
  input: number[][]
): PredictResult {
  // Flatten input matrix into 1D array (784 elements for 28x28)
  const flattenedInput = input.flat();

  // First hidden layer with sigmoid activation
  const hidden1 = matrixVectorMultiply(weights.inputLayerWeights, flattenedInput);
  const hidden1Output = hidden1.map((val, i) => sigmoid(val + weights.inputLayerBias[i]));

  // Second hidden layer with ReLU activation
  const hidden2 = matrixVectorMultiply(weights.hiddenLayerWeights, hidden1Output);
  const hidden2Output = hidden2.map((val, i) => relu(val + weights.hiddenLayerBias[i]));

  // Output layer with softmax activation (11 classes: 0-9 + None)
  const output = matrixVectorMultiply(weights.outputLayerWeights, hidden2Output);
  const preActivationOutput = output.map((val, i) => val + weights.outputLayerBias[i]);
  const finalOutput = softmax(preActivationOutput);

  // Find predicted class and confidence
  let maxIndex = 0;
  let maxValue = finalOutput[0];
  for (let i = 1; i < finalOutput.length; i++) {
    if (finalOutput[i] > maxValue) {
      maxValue = finalOutput[i];
      maxIndex = i;
    }
  }

  return {
    hidden1Output,
    hidden2Output,
    finalOutput,
    predictedClass: maxIndex,
    confidence: maxValue,
  };
}

/**
 * Get top N predictions with their confidences.
 */
export function getTopPredictions(
  result: PredictResult,
  topN: number = 3
): Array<{ digit: number; confidence: number }> {
  const predictions = result.finalOutput
    .map((confidence, index) => ({ digit: index, confidence }))
    // Filter out the "none" class (class 10) unless it's the top prediction
    .filter((p, _, arr) => p.digit < 10 || p.confidence === Math.max(...arr.map(x => x.confidence)))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topN);

  return predictions;
}
