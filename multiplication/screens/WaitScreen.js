import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function WaitScreen({ navigation, route }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [spinValue] = useState(new Animated.Value(0));
  const [pulseValue] = useState(new Animated.Value(1));
  const [gameStarted, setGameStarted] = useState(false);
  const [floatingElements] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      symbol: ["⏳", "⏰", "🎮", "🎯", "⭐", "✨"][
        Math.floor(Math.random() * 6)
      ],
      animValue: new Animated.Value(0),
      left: Math.random() * 100,
      duration: 10000 + Math.random() * 5000,
      delay: Math.random() * 3000,
      size: 20 + Math.random() * 15,
    }))
  );

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    sessionId,
    studentId,
    studentName,
    level,
    playerId,
    code,
    selectedCharacter,
  } = route.params;

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
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded]);

  useEffect(() => {
    // Add player to waiting list when component mounts
    const addToWaitingList = async () => {
      try {
        await updateDoc(doc(db, "sessions", sessionId), {
          waitingPlayers: arrayUnion({
            studentId,
            name: studentName,
            playerId,
            joinedAt: Date.now(),
          }),
        });
      } catch (error) {
        console.error("Error adding to waiting list:", error);
      }
    };

    addToWaitingList();

    // Listen for game start
    const unsubscribe = onSnapshot(doc(db, "sessions", sessionId), (doc) => {
      const data = doc.data();
      if (data?.gameStarted === true) {
        setGameStarted(true);
        // Navigate to QuizScreen when game starts
        navigation.replace("QuizScreen", {
          sessionId,
          studentId,
          studentName,
          level,
          playerId,
          code,
          selectedCharacter,
        });
      }
    });

    return () => unsubscribe();
  }, [sessionId, studentId, studentName, playerId]);

  useEffect(() => {
    // Create spinning animation
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();

    // Create pulsing animation
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [spinValue, pulseValue]);

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={["#4fd1ff", "#5b9cf5", "#ff5fcf"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Background overlay pattern */}
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

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Character Display */}
        {selectedCharacter !== null && selectedCharacter !== undefined && (
          <Animated.View
            style={[
              styles.characterContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.characterCircle}>
              <Image
                source={characterImages[selectedCharacter]}
                style={styles.characterImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.statusText}>Connected</Text>
            </View>
          </Animated.View>
        )}

        {/* Welcome Message */}
        <Animated.View
          style={[
            styles.welcomeContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={["#f97316", "#facc15"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.welcomeBox}
          >
            <Text style={styles.welcomeText}>Welcome!</Text>
            <Text style={styles.playerName}>{studentName}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Loading Spinner */}
        <Animated.View
          style={[
            styles.spinnerContainer,
            {
              transform: [{ scale: pulseValue }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.spinner,
              { transform: [{ rotate: spinInterpolate }] },
            ]}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.spinnerOuter}
            >
              <View style={styles.spinnerInner}>
                <Text style={styles.spinnerIcon}>⏳</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Waiting Text */}
        <Animated.View
          style={[
            styles.waitingContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.waitingText}>Waiting for Teacher...</Text>
          <Text style={styles.subText}>
            The game will start soon! Get ready! 🎮
          </Text>
        </Animated.View>

        {/* Session Info */}
        <Animated.View
          style={[
            styles.sessionInfoContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.infoBadge}>
            <Text style={styles.infoIcon}>🔑</Text>
            <View>
              <Text style={styles.infoLabel}>Session Code</Text>
              <Text style={styles.infoValue}>{code}</Text>
            </View>
          </View>
          <View style={[styles.infoBadge, { marginTop: 12 }]}>
            <Text style={styles.infoIcon}>📊</Text>
            <View>
              <Text style={styles.infoLabel}>Level</Text>
              <Text style={styles.infoValue}>{level}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Fun Fact */}
        <Animated.View
          style={[
            styles.funFactContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.funFactIcon}>💡</Text>
          <Text style={styles.funFactText}>
            Did you know? You can ask your teacher questions anytime!
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  contentContainer: {
    flex: 1,
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
  characterContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  characterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  characterImage: {
    width: 90,
    height: 90,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.95)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: -12,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  statusDot: {
    color: "#fff",
    fontSize: 12,
    marginRight: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
  },
  welcomeContainer: {
    marginBottom: 32,
    width: "100%",
    maxWidth: 400,
  },
  welcomeBox: {
    borderRadius: 30,
    paddingHorizontal: 32,
    paddingVertical: 20,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
  },
  welcomeText: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  playerName: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  spinnerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  spinner: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 5,
    borderColor: "#fff",
  },
  spinnerInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerIcon: {
    fontSize: 50,
  },
  waitingContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  waitingText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    fontFamily: "BernerBasisschrift1",
    letterSpacing: 0.5,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 26,
  },
  sessionInfoContainer: {
    width: "100%",
    maxWidth: 350,
    marginBottom: 24,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 3,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    fontFamily: "BernerBasisschrift1",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f97316",
    fontFamily: "BernerBasisschrift1",
    letterSpacing: 0.5,
  },
  funFactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(250, 204, 21, 0.95)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    maxWidth: 400,
  },
  funFactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  funFactText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
