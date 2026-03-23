import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

// Replace with your local machine's IP address and appropriate port (5000 is default for this backend)
const API_BASE_URL = 'http://192.168.1.100:5000/api/auth'; 

const AuthScreen = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('SEND_OTP'); // 'SEND_OTP' | 'VERIFY_OTP'
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      // We pass phone, and optionally countryCode if needed. 
      // The backend expects countryCode='+91' by default.
      const response = await axios.post(`${API_BASE_URL}/send-otp`, { 
        phone, 
        countryCode: '+91' 
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'WhatsApp OTP sent successfully!');
        setStep('VERIFY_OTP');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, { 
        phone, 
        otp 
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Logged in successfully!');
        // Usually, save the token to AsyncStorage and proceed to next screen
        // e.g. AsyncStorage.setItem('token', response.data.token)
      } else {
        Alert.alert('Error', response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Enter your phone number to login or register</Text>

      {step === 'SEND_OTP' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (10 digits)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : (
            <Button title="Login with WhatsApp OTP" onPress={handleSendOtp} />
          )}
        </>
      ) : (
        <>
          <Text style={styles.infoText}>OTP sent to +91 {phone}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 4-digit OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={4}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : (
            <View style={styles.buttonRow}>
              <Button title="Back" color="gray" onPress={() => setStep('SEND_OTP')} />
              <Button title="Verify OTP" onPress={handleVerifyOtp} />
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#444',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  }
});

export default AuthScreen;
