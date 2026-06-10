import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, BackHandler, Platform, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export default function App() {
  const webViewRef = useRef(null);
  const [expoPushToken, setExpoPushToken] = useState('');

  // 👇 YAHAN APNA NETLIFY/LOCALTUNNEL WALA LINK DAAL
  const WEB_APP_URL = "https://globalstudiesarchive.netlify.app";

  useEffect(() => {
    // Check if we are running inside Expo Go
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

    async function setupSystem() {
      // 🚨 ABSOLUTE BYPASS FOR EXPO GO 🚨
      // Agar Expo Go hai, toh notification ka koi function call mat karo
      if (isExpoGo) {
        console.log("Running in Expo Go! Bypassing all Notification setup to prevent crash.");
        setExpoPushToken("DUMMY_TOKEN_FOR_EXPO_GO_TESTING");
        return;
      }

      // --- ASLI NOTIFICATION LOGIC (Sirf APK me chalega) ---
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            console.log('Failed to get push token!');
            setExpoPushToken("DUMMY_TOKEN_FAIL");
            return;
          }
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId || "ff492ade-996c-4402-840b-c1fe3021bf91", 
          });
          setExpoPushToken(tokenData.data);
        } else {
          setExpoPushToken("DUMMY_TOKEN_SIMULATOR");
        }
      } catch (error) {
        console.log("Notification setup failed:", error);
        setExpoPushToken("DUMMY_TOKEN_ERROR");
      }
    }

    // Call the setup function
    setupSystem();

    // Hardware Back Button logic for Android
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  // --- EDUCATIONAL DECOY LOADING SCREEN ---
  if (!expoPushToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Initializing secure modules...</Text>
      </View>
    );
  }

  // Inject token securely into LocalStorage AND send postMessage so Next.js catches it immediately
  const INJECTED_JAVASCRIPT = `
    window.EXPO_PUSH_TOKEN = "${expoPushToken}";
    window.localStorage.setItem("EXPO_PUSH_TOKEN", "${expoPushToken}");
    window.postMessage(JSON.stringify({ type: 'EXPO_PUSH_TOKEN', token: "${expoPushToken}" }), '*');
    true; 
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        allowsBackForwardNavigationGestures
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#475569', 
    marginTop: 16,
    fontFamily: 'sans-serif', 
    fontSize: 14,
    fontWeight: '500',
  },
  webview: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
    backgroundColor: '#f8fafc',
  },
});