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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function PasswordScreen({ navigation, route }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [floatingElements] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      symbol: ["🔐", "🔑", "⭐", "✨", "🎯"][Math.floor(Math.random() * 5)],
      animValue: new Animated.Value(0),
      left: Math.random() * 100,
      duration: 10000 + Math.random() * 5000,
      delay: Math.random() * 3000,
      size: 20 + Math.random() * 15,
    }))
  );

  const logoScale = useRef(new Animated.Value(0)).current;
  const inputSlide = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const { studentId, sessionId, level, playerId, code, selectedCharacter } =
    route.params || {};

  // Character images mapping
  const characterImages = [
    require("../assets/player1.png"),
    require("../assets/player2.png"),
    require("../assets/player3.png"),
    require("../assets/player4.png"),
  ];

  useEffect(() => {
    Font.loadAsync({
      BernerBasisschrift1: require("../assets/fonts/BernerBasisschrift1.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    // Floating animations
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

    // Entrance animations
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(inputSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fontsLoaded]);

  async function handleCheckPassword() {
    if (!password.trim()) {
      triggerShake();
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const studentRef = doc(
        db,
        "students",
        "rTPhhHNRT5gMWFsZWdrtmpUVhWd2",
        "list",
        studentId
      );
      const studentSnap = await getDoc(studentRef);
      setLoading(false);

      if (
        studentSnap.exists() &&
        String(studentSnap.data().password).trim() === String(password).trim()
      ) {
        // Success animation
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        navigation.navigate("WaitScreen", {
          sessionId,
          level,
          playerId,
          code,
          studentId,
          studentName: `${studentSnap.data().firstname} ${
            studentSnap.data().lastname
          }`,
          selectedCharacter,
        });
      } else {
        setError(true);
        triggerShake();
        setTimeout(() => {
          navigation.replace("NameScreen", {
            wrongPassword: true,
            sessionId,
            level,
            playerId,
            code,
            selectedCharacter,
          });
        }, 1500);
      }
    } catch (err) {
      setLoading(false);
      setError(true);
      triggerShake();
      console.error("Error checking password:", err);
    }
  }

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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

      {/* Floating Symbols */}
      {floatingElements.map((element) => {
        const translateY = element.animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [height, -200],
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected Character Display */}
        {selectedCharacter !== null && selectedCharacter !== undefined && (
          <Animated.View
            style={[
              styles.characterContainer,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            <View style={styles.characterCircle}>
              <Image
                source={characterImages[selectedCharacter]}
                style={styles.characterImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.characterBadge}>
              <Text style={styles.characterBadgeText}>Your Character</Text>
            </View>
          </Animated.View>
        )}

        {/* Title */}
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <LinearGradient
            colors={["#f97316", "#facc15"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.titleBox}
          >
            <Text style={styles.titleText}>🔐 Enter Password</Text>
          </LinearGradient>
        </Animated.View>

        {/* Session Info */}
        <Animated.View
          style={[
            styles.sessionInfoBox,
            { transform: [{ translateY: inputSlide }] },
          ]}
        >
          <View style={styles.infoBadge}>
            <Text style={styles.infoLabel}>Session:</Text>
            <Text style={styles.infoValue}>{code}</Text>
          </View>
          <View style={[styles.infoBadge, { marginLeft: 12 }]}>
            <Text style={styles.infoLabel}>Level:</Text>
            <Text style={styles.infoValue}>{level}</Text>
          </View>
        </Animated.View>

        {/* Password Input */}
        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [
                { translateY: inputSlide },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          <View style={[styles.inputWrapper, error && styles.inputError]}>
            <Text style={styles.inputIcon}>🔑</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(false);
              }}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              editable={!loading}
            />
          </View>
          {error && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>Wrong password!</Text>
            </View>
          )}
        </Animated.View>

        {/* Enter Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.enterButton, loading && styles.enterButtonDisabled]}
            onPress={handleCheckPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ["#9ca3af", "#6b7280"] : ["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.enterButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.enterButtonText}>ENTER</Text>
                  <Text style={styles.enterButtonIcon}>→</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Helper Text */}
        <Animated.View
          style={[
            styles.helperContainer,
            { transform: [{ scale: buttonScale }] },
          ]}
        >
          <Text style={styles.helperText}>
            💡 Ask your teacher if you forgot your password
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  floatingSymbol: {
    position: "absolute",
    opacity: 0.6,
    zIndex: 1,
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
  characterContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  characterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  characterImage: {
    width: 110,
    height: 110,
  },
  characterBadge: {
    backgroundColor: "rgba(249, 115, 22, 0.95)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: -15,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  characterBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
  },
  titleBox: {
    borderRadius: 30,
    paddingHorizontal: 40,
    paddingVertical: 16,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: 24,
  },
  titleText: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  sessionInfoBox: {
    flexDirection: "row",
    marginBottom: 32,
    alignItems: "center",
  },
  infoBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginRight: 6,
    fontFamily: "BernerBasisschrift1",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#f97316",
    fontFamily: "BernerBasisschrift1",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 3,
    borderColor: "#e0e0e0",
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 4,
  },
  inputIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    paddingVertical: 0,
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
  },
  enterButton: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: "#fff",
  },
  enterButtonDisabled: {
    opacity: 0.7,
  },
  enterButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  enterButtonText: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    letterSpacing: 2,
    marginRight: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  enterButtonIcon: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  helperContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  helperText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 24,
  },
  loadingText: {
    color: "#fff",
    marginTop: 20,
    fontFamily: "BernerBasisschrift1",
    fontSize: 18,
    fontWeight: "700",
  },
});
