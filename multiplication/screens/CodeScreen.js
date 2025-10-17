import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Animated,
  Easing,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

export default function CodeScreen({ navigation }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [floatingElements] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      symbol: ["➕", "➖", "✖️", "➗", "🌟", "⭐", "💫", "✨", "🎯", "🎮"][
        Math.floor(Math.random() * 10)
      ],
      animValue: new Animated.Value(0),
      left: Math.random() * 100,
      duration: 12000 + Math.random() * 8000,
      delay: Math.random() * 5000,
      size: 25 + Math.random() * 25,
    }))
  );

  const logoScale = useRef(new Animated.Value(1)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load fonts
    Font.loadAsync({
      BernerBasisschrift1: require("../assets/fonts/BernerBasisschrift1.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    // Start floating animations
    floatingElements.forEach((element) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(element.delay),
          Animated.timing(element.animValue, {
            toValue: 1,
            duration: element.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Logo gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fontsLoaded]);

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleJoinSession = async () => {
    if (!codeInput.trim()) {
      setJoinError("Please enter a session code");
      shakeInput();
      return;
    }

    setJoinError("");
    setIsJoining(true);
    Keyboard.dismiss();

    try {
      console.log("Looking for session with code:", codeInput);

      const q = query(
        collection(db, "sessions"),
        where("code", "==", codeInput.trim())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setJoinError("Session not found. Please check the code.");
        shakeInput();
        setIsJoining(false);
        return;
      }

      const sessionDoc = snap.docs[0];
      const sessionData = sessionDoc.data();

      console.log("Found session:", sessionData);

      if (sessionData.status === "completed") {
        setJoinError("This session has already ended.");
        shakeInput();
        setIsJoining(false);
        return;
      }

      const playerId =
        "player-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);

      await updateDoc(doc(db, "sessions", sessionDoc.id), {
        players: arrayUnion(playerId),
      });

      console.log("Successfully joined session, navigating to SelectCharacter");

      // Success animation
      Animated.spring(inputScale, {
        toValue: 1.1,
        friction: 3,
        useNativeDriver: true,
      }).start(() => {
        navigation.navigate("SelectCharacter", {
          sessionId: sessionDoc.id,
          level: sessionData.level,
          playerId,
          code: codeInput.trim(),
        });
      });
    } catch (error) {
      console.error("Error joining session:", error);
      setJoinError("Failed to join session. Please try again.");
      shakeInput();
    } finally {
      setIsJoining(false);
    }
  };

  const toggleMusic = () => {
    setIsMusicOn(!isMusicOn);
    // Music toggle logic will be added during development
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      handleJoinSession();
    });
  };

  if (!fontsLoaded) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <LinearGradient
          colors={["#4fd1ff", "#5b9cf5", "#ff5fcf"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={["#4fd1ff", "#5b9cf5", "#ff5fcf"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Overlay image */}
      <Image
        source={require("../assets/bgoverlay.png")}
        style={[
          StyleSheet.absoluteFillObject,
          { width: "100%", height: "100%", opacity: 0.3 },
        ]}
        resizeMode="cover"
      />

      {/* Floating Math Symbols */}
      {floatingElements.map((element) => {
        const translateY = element.animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [800, -200],
        });

        return (
          <Animated.Text
            key={element.id}
            style={[
              styles.floatingSymbol,
              {
                left: `${element.left}%`,
                fontSize: element.size,
                transform: [{ translateY }],
              },
            ]}
          >
            {element.symbol}
          </Animated.Text>
        );
      })}

      {/* Music Toggle Button */}
      <TouchableOpacity
        style={styles.musicButton}
        onPress={toggleMusic}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#FFD700", "#FFA500"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.musicButtonGradient}
        >
          <Text style={styles.musicIcon}>{isMusicOn ? "🎵" : "🔇"}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backButtonGradient}
        >
          <Text style={styles.backIcon}>←</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo with Animation */}
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Image
            source={require("../assets/title.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>Enter Session Code</Text>

        {/* Code Input with Animation */}
        <Animated.View
          style={{
            transform: [{ translateX: shakeAnimation }, { scale: inputScale }],
          }}
        >
          <TextInput
            value={codeInput}
            onChangeText={(text) => {
              setCodeInput(text);
              setJoinError("");
            }}
            placeholder="000000"
            placeholderTextColor="#9ca3af"
            style={styles.codeInput}
            keyboardType="numeric"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isJoining}
          />
        </Animated.View>

        {/* Join Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
            onPress={handleButtonPress}
            disabled={isJoining}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                isJoining ? ["#d1d5db", "#9ca3af"] : ["#f97316", "#facc15"]
              }
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.joinButtonGradient}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <View style={styles.joinIconCircle}>
                    <Text style={styles.joinIconText}>✓</Text>
                  </View>
                  <Text style={styles.joinText}>JOIN</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Error Message */}
        {joinError ? (
          <Animated.View style={styles.errorContainer} entering="fadeIn">
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{joinError}</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  floatingSymbol: {
    position: "absolute",
    opacity: 0.6,
    zIndex: 1,
  },
  musicButton: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 70,
    height: 70,
    borderRadius: 35,
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: "#fff",
  },
  musicButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  musicIcon: {
    fontSize: 36,
  },
  backButton: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 70,
    height: 70,
    borderRadius: 35,
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: "#fff",
  },
  backButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  logo: {
    width: 500,
    height: 250,
    marginBottom: 20,
  },
  instructionText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
    textAlign: "center",
    marginBottom: 24,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  codeInput: {
    height: 80,
    borderWidth: 4,
    borderColor: "#fff",
    borderRadius: 40,
    paddingHorizontal: 30,
    width: 280,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    fontSize: 36,
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: "BernerBasisschrift1",
    color: "#374151",
    letterSpacing: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  joinButton: {
    marginTop: 32,
    borderRadius: 60,
    overflow: "hidden",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  joinButtonDisabled: {
    shadowColor: "#9ca3af",
    shadowOpacity: 0.3,
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 60,
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  joinIconCircle: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  joinIconText: {
    fontSize: 30,
    color: "#f97316",
    fontWeight: "bold",
  },
  joinText: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 3,
  },
  errorContainer: {
    marginTop: 24,
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "BernerBasisschrift1",
    textAlign: "center",
    flex: 1,
  },
});
