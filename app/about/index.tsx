import { Link } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function About() {
  return (
    <View className="flex-1 items-center justify-center">
      <View>
        <Text>his is about page</Text>
      </View>
      <View>
        <Text>Ha Ha Ha</Text>
      </View>
      <Link href="/">Home</Link>
    </View>
  );
}
