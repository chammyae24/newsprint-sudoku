import { Link } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
      {/* Header */}
      <View className="px-5 pb-2 pt-4">
        <Text className="text-center text-2xl font-bold text-gray-800">
          Newsprint Sudoku
        </Text>
      </View>

      {/* Actions */}
      <View className="items-center justify-center gap-4 py-3">
        <View>
          <Link
            href={'/game' as any}
            className="rounded-full bg-amber-100 px-4 py-2.5"
          >
            <Text className="text-sm font-medium text-amber-600">
              🎮 Start Game
            </Text>
          </Link>
        </View>
        <View>
          <Link
            href={'/test/handwriting' as any}
            className="rounded-full bg-amber-100 px-4 py-2.5"
          >
            <Text className="text-sm font-medium text-amber-600">
              ✏️ Test Handwriting
            </Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
