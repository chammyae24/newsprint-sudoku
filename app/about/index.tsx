import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function About() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.text}>This is the about page</Text>
      </View>
      <Link href="/" style={styles.link}>
        Home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EDE0',
  },
  text: {
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
    color: '#2A2118',
  },
  link: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
    color: '#8B7355',
    marginTop: 16,
  },
});
