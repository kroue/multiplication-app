import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";

const { width } = Dimensions.get("window");

const characters = [
  { id: 0, src: require("../assets/player1.png"), name: "Alex" },
  { id: 1, src: require("../assets/player2.png"), name: "Maya" },
  { id: 2, src: require("../assets/player3.png"), name: "Leo" },
  { id: 3, src: require("../assets/player4.png"), name: "Zoe" },
];

export default function SelectCharacter({ navigation, route }) {
  const [selected, setSelected] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [floatingElements] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      symbol: ["🌟", "⭐", "✨", "💫"][Math.floor(Math.random() * 4)],
      animValue: new Animated.Value(0),
      left: Math.random() * 100,
      duration: 10000 + Math.random() * 5000,
      delay: Math.random() * 3000,
      size: 20 + Math.random() * 20,
    }))
  );

  const headerSlide = useRef(new Animated.Value(-300)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;
  const characterScales = useRef(
    characters.map(() => new Animated.Value(0))
  ).current;
  const selectedPulse = useRef(new Animated.Value(1)).current;

  const { sessionId, level, playerId, code } = route.params || {};

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

    // Header slide in
    Animated.spring(headerSlide, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Characters pop in with stagger
    characters.forEach((_, idx) => {
      Animated.spring(characterScales[idx], {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: idx * 100,
        useNativeDriver: true,
      }).start();
    });

    // Button scale in when character selected
    if (selected !== null) {
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Pulse animation for selected character
      Animated.loop(
        Animated.sequence([
          Animated.timing(selectedPulse, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(selectedPulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fontsLoaded, selected]);

  const handleCharacterSelect = (idx) => {
    setSelected(idx);

    // Reset button scale before animating in
    buttonScale.setValue(0);

    // Bounce animation on selection
    Animated.sequence([
      Animated.timing(characterScales[idx], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(characterScales[idx], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
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
      navigation.navigate("NameScreen", {
        sessionId,
        level,
        playerId,
        code,
        selectedCharacter: selected,
      });
    });
  };

  const toggleMusic = () => {
    setIsMusicOn(!isMusicOn);
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

      {/* Floating Stars */}
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

      {/* Header with animation */}
      <Animated.View
        style={[
          styles.headerContainer,
          { transform: [{ translateX: headerSlide }] },
        ]}
      >
        <LinearGradient
          colors={["#f97316", "#facc15"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.headerBox}
        >
          <Text style={styles.headerText}>Choose Your Character!</Text>
        </LinearGradient>
      </Animated.View>

      {/* Character Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {characters.map((character, idx) => {
            const isSelected = selected === idx;
            const scale = isSelected ? selectedPulse : characterScales[idx];

            return (
              <Animated.View
                key={character.id}
                style={[styles.characterWrapper, { transform: [{ scale }] }]}
              >
                <TouchableOpacity
                  style={[
                    styles.characterBox,
                    isSelected && styles.characterSelected,
                  ]}
                  onPress={() => handleCharacterSelect(idx)}
                  activeOpacity={0.9}
                >
                  {/* Glow effect for selected */}
                  {isSelected && <View style={styles.glowEffect} />}

                  {/* Character Image */}
                  <Image
                    source={character.src}
                    style={styles.characterImg}
                    resizeMode="contain"
                  />

                  {/* Character Name Badge */}
                  <View style={styles.nameBadge}>
                    <Text style={styles.characterName}>{character.name}</Text>
                  </View>

                  {/* Selected Checkmark */}
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Continue Button */}
      {selected !== null && (
        <Animated.View
          style={[
            styles.buttonContainer,
            { transform: [{ scale: buttonScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#f97316", "#facc15"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueText}>CONTINUE</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
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
  headerContainer: {
    marginTop: 120,
    alignSelf: "center",
    zIndex: 10,
  },
  headerBox: {
    borderRadius: 40,
    paddingHorizontal: 40,
    paddingVertical: 16,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#fff",
  },
  headerText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: "center",
  },
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 700,
  },
  characterWrapper: {
    margin: 10,
  },
  characterBox: {
    width: width > 600 ? 180 : 150,
    height: width > 600 ? 220 : 190,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: "visible",
    position: "relative",
  },
  characterSelected: {
    borderColor: "#facc15",
    borderWidth: 6,
    backgroundColor: "#fffef0",
    shadowColor: "#facc15",
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 12,
  },
  glowEffect: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40,
    backgroundColor: "#facc15",
    opacity: 0.3,
    zIndex: -1,
  },
  characterImg: {
    width: width > 600 ? 140 : 120,
    height: width > 600 ? 140 : 120,
    marginTop: 10,
  },
  nameBadge: {
    marginTop: 8,
    backgroundColor: "#f97316",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  characterName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  checkmark: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4ade80",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  checkmarkText: {
    fontSize: 30,
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: 40,
    zIndex: 20,
  },
  continueButton: {
    borderRadius: 60,
    overflow: "hidden",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  continueButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 60,
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  continueText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    marginRight: 15,
  },
  arrowCircle: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  arrowText: {
    fontSize: 30,
    color: "#f97316",
    fontWeight: "bold",
  },
});
