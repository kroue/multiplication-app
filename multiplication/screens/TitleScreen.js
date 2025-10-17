import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";

export default function TitleScreen({ navigation }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isPlayHovered, setIsPlayHovered] = useState(false);
  const [floatingElements] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
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
  const logoRotate = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const playButtonBounce = useRef(new Animated.Value(0)).current;
  const playIconScale = useRef(new Animated.Value(1)).current;

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

    // Logo bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Play button gentle bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(playButtonBounce, {
          toValue: -10,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(playButtonBounce, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Play icon pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(playIconScale, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(playIconScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fontsLoaded]);

  const handleLogoPress = () => {
    // Bounce animation on press
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1.1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePlayPress = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(playButtonScale, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(playButtonScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(playIconScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(playIconScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(() => navigation?.navigate("CodeScreen"), 200);
    });
  };

  const toggleMusic = () => {
    setIsMusicOn(!isMusicOn);
    // Music toggle logic will be added during development
  };

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "5deg"],
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

      {/* Content */}
      <View style={styles.content}>
        {/* Logo with Animation */}
        <TouchableOpacity
          onPress={handleLogoPress}
          activeOpacity={0.9}
          style={styles.logoContainer}
        >
          <Animated.View
            style={{
              transform: [{ scale: logoScale }, { rotate: logoRotation }],
            }}
          >
            <Image
              source={require("../assets/title.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Let's learn math and play! ✨🎮</Text>

        {/* Play Button */}
        <Animated.View
          style={{
            transform: [
              { translateY: playButtonBounce },
              { scale: playButtonScale },
            ],
          }}
        >
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPress}
            onPressIn={() => setIsPlayHovered(true)}
            onPressOut={() => setIsPlayHovered(false)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#f97316", "#facc15"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.playButtonGradient}
            >
              {/* YouTube-style Play Icon */}
              <Animated.View
                style={[
                  styles.playIconCircle,
                  { transform: [{ scale: playIconScale }] },
                ]}
              >
                <View style={styles.playTriangle} />
              </Animated.View>
              <Text style={styles.playText}>PLAY</Text>
            </LinearGradient>
            {/* Glow effect */}
            {isPlayHovered && <View style={styles.glowEffect} />}
          </TouchableOpacity>
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  logoContainer: {
    marginTop: -50,
    marginBottom: 20,
  },
  logo: {
    width: 600,
    height: 300,
  },
  subtitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  playButton: {
    marginTop: 16,
    borderRadius: 60,
    overflow: "hidden",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    fontWeight: "bold",
  },
  playButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 60,
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  playIconCircle: {
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
  playTriangle: {
    width: 0,
    height: 0,
    marginLeft: 4,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 18,
    borderRightWidth: 0,
    borderBottomWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: "#f97316",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
  },
  playText: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 3,
  },
  glowEffect: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 70,
    backgroundColor: "#facc15",
    opacity: 0.3,
    zIndex: -1,
  },
});
