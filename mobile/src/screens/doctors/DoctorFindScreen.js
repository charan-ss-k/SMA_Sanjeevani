import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DoctorFindScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Doctors</Text>
      <Text style={styles.message}>Doctor finder coming soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
  },
});

export default DoctorFindScreen;
