import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function RankingScreen({ route, navigation }) {
  const { sessionId, studentId } = route.params;
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [scores, setScores] = useState([]);
  const [currentStudentData, setCurrentStudentData] = useState(null);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [floatingElements] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      symbol: ["🏆", "🥇", "🥈", "🥉", "⭐", "✨", "🎉"][
        Math.floor(Math.random() * 7)
      ],
      animValue: new Animated.Value(0),
      left: Math.random() * 100,
      duration: 10000 + Math.random() * 5000,
      delay: Math.random() * 3000,
      size: 20 + Math.random() * 15,
    }))
  );

  const headerScale = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

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

    // Header entrance
    Animated.spring(headerScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Confetti burst
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.timing(confettiAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!sessionId) {
      console.error("SessionId is missing");
      return;
    }

    const unsub = onSnapshot(
      doc(db, "sessions", sessionId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const scoresArr = Array.isArray(data?.scores) ? data.scores : [];

          // Find current student's data
          const currentStudent = scoresArr.find(
            (score) => score.studentId === studentId
          );
          setCurrentStudentData(currentStudent);

          // Sort by score descending, then finishedAt ascending
          scoresArr.sort(
            (a, b) => b.score - a.score || a.finishedAt - b.finishedAt
          );
          setScores(scoresArr);
        }
      },
      (error) => {
        console.error("Error listening to session:", error);
      }
    );

    return () => unsub();
  }, [sessionId, studentId]);

  const handleCheckResults = () => {
    navigation.navigate("ResultScreen", {
      sessionId,
      studentId,
      studentData: currentStudentData,
      allScores: scores,
    });
  };

  const toggleMusic = () => {
    setIsMusicOn(!isMusicOn);
  };

  const getMedalEmoji = (index) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "🏅";
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return ["#FFD700", "#FFA500"]; // Gold
      case 1:
        return ["#C0C0C0", "#A8A8A8"]; // Silver
      case 2:
        return ["#CD7F32", "#B87333"]; // Bronze
      default:
        return ["#667eea", "#764ba2"]; // Purple
    }
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

      {/* Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          { transform: [{ scale: headerScale }] },
        ]}
      >
        <LinearGradient
          colors={["#f97316", "#facc15"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.headerBox}
        >
          <Text style={styles.headerIcon}>🏆</Text>
          <Text style={styles.headerText}>RANKINGS</Text>
        </LinearGradient>
      </Animated.View>

      {/* Podium for Top 3 */}
      {scores.length >= 3 && (
        <View style={styles.podiumContainer}>
          {/* 2nd Place */}
          <PodiumCard rank={scores[1]} index={1} delay={100} />
          {/* 1st Place */}
          <PodiumCard rank={scores[0]} index={0} delay={0} />
          {/* 3rd Place */}
          <PodiumCard rank={scores[2]} index={2} delay={200} />
        </View>
      )}

      {/* Rankings List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {scores.length === 0 ? (
          <View style={styles.noScoresContainer}>
            <Text style={styles.noScoresIcon}>⏳</Text>
            <Text style={styles.noScoresText}>Waiting for scores...</Text>
          </View>
        ) : (
          scores.map((rank, idx) => (
            <RankCard
              key={`${rank.studentId}-${idx}`}
              rank={rank}
              index={idx}
              isCurrentStudent={rank.studentId === studentId}
              delay={idx * 50}
            />
          ))
        )}
      </ScrollView>

      {/* Check Your Results Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.checkResultsButton}
          onPress={handleCheckResults}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#10b981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonIcon}>📊</Text>
            <Text style={styles.buttonText}>CHECK YOUR RESULTS</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Podium Card Component
function PodiumCard({ rank, index, delay }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous bounce for 1st place
    if (index === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const getMedalEmoji = (idx) => {
    switch (idx) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "🏅";
    }
  };

  const colors = [
    ["#FFD700", "#FFA500"], // Gold
    ["#C0C0C0", "#A8A8A8"], // Silver
    ["#CD7F32", "#B87333"], // Bronze
  ];

  const heights = [120, 90, 70];
  const order = [1, 0, 2]; // Display order: 2nd, 1st, 3rd

  return (
    <Animated.View
      style={[
        styles.podiumCard,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: index === 0 ? bounceAnim : 0 },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={colors[index]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.podiumBox, { height: heights[index] }]}
      >
        <Text style={styles.podiumMedal}>{getMedalEmoji(index)}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>
          {rank.name}
        </Text>
        <Text style={styles.podiumScore}>{rank.score} pts</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// Rank Card Component
function RankCard({ rank, index, isCurrentStudent, delay }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getMedalEmoji = (idx) => {
    switch (idx) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "🏅";
    }
  };

  const getRankColor = (idx) => {
    switch (idx) {
      case 0:
        return ["#FFD700", "#FFA500"];
      case 1:
        return ["#C0C0C0", "#A8A8A8"];
      case 2:
        return ["#CD7F32", "#B87333"];
      default:
        return ["#667eea", "#764ba2"];
    }
  };

  return (
    <Animated.View
      style={[
        styles.rankRow,
        {
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={getRankColor(index)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.rankBar, isCurrentStudent && styles.currentStudentBar]}
      >
        <View style={styles.rankContent}>
          <View style={styles.rankLeft}>
            <View style={styles.rankNumberBadge}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <Text style={styles.rankMedal}>{getMedalEmoji(index)}</Text>
            <Text
              style={[
                styles.rankName,
                isCurrentStudent && styles.currentStudentName,
              ]}
              numberOfLines={1}
            >
              {rank.name}
            </Text>
          </View>
          <View style={styles.rankScoreBadge}>
            <Text style={styles.rankScore}>{rank.score}</Text>
            <Text style={styles.rankScoreLabel}>pts</Text>
          </View>
        </View>
      </LinearGradient>
      {isCurrentStudent && (
        <View style={styles.youBadge}>
          <Text style={styles.youBadgeText}>YOU</Text>
        </View>
      )}
    </Animated.View>
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
    alignItems: "center",
    marginTop: 110,
    marginBottom: 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerBox: {
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
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  podiumCard: {
    flex: 1,
    maxWidth: 110,
  },
  podiumBox: {
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  podiumMedal: {
    fontSize: 40,
    marginBottom: 8,
  },
  podiumName: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  podiumScore: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  rankRow: {
    marginBottom: 14,
    position: "relative",
  },
  rankBar: {
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 4,
    borderColor: "#fff",
  },
  currentStudentBar: {
    borderWidth: 5,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOpacity: 0.6,
  },
  rankContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rankLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankNumber: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
  },
  rankMedal: {
    fontSize: 28,
    marginRight: 12,
  },
  rankName: {
    flex: 1,
    color: "#fff",
    fontSize: 20,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currentStudentName: {
    fontWeight: "900",
    fontSize: 22,
  },
  rankScoreBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "baseline",
  },
  rankScore: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    marginRight: 4,
  },
  rankScoreLabel: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
  },
  youBadge: {
    position: "absolute",
    top: -8,
    right: 16,
    backgroundColor: "#FFD700",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  youBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    letterSpacing: 1,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  checkResultsButton: {
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
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    letterSpacing: 1,
    marginRight: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonArrow: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  noScoresContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noScoresIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  noScoresText: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
