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
import { doc, getDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function ResultScreen({ route, navigation }) {
  const { sessionId, studentId, studentData, allScores } = route.params;
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [questionResults, setQuestionResults] = useState([]);
  const [currentTip, setCurrentTip] = useState(null);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [floatingElements] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      symbol: ["🎉", "⭐", "✨", "🎊", "💯"][Math.floor(Math.random() * 5)],
      animValue: new Animated.Value(0),
      left: Math.random() * 100,
      duration: 10000 + Math.random() * 5000,
      delay: Math.random() * 3000,
      size: 20 + Math.random() * 15,
    }))
  );

  const headerScale = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0)).current;

  // 10 multiplication tips that will be shown randomly
  const multiplicationTips = [
    {
      number: 1,
      title: "Zero Magic!",
      text: "Any number multiplied by 0 equals 0. It's like magic - everything disappears! Example: 25 × 0 = 0, 1000 × 0 = 0",
    },
    {
      number: 2,
      title: "The Identity Hero!",
      text: "Any number multiplied by 1 stays the same! It's the identity superhero of multiplication. Example: 47 × 1 = 47",
    },
    {
      number: 3,
      title: "Doubling Fun!",
      text: "To multiply by 2, just double the number! It's like having twins. Example: 13 × 2 = 13 + 13 = 26",
    },
    {
      number: 4,
      title: "Five's Trick!",
      text: "To multiply by 5, multiply by 10 and divide by 2! Example: 8 × 5 = (8 × 10) ÷ 2 = 80 ÷ 2 = 40",
    },
    {
      number: 5,
      title: "Nine's Finger Magic!",
      text: "For 9 times tables, hold up your fingers and fold down the number you're multiplying. Count tens and ones! Try 9 × 4!",
    },
    {
      number: 6,
      title: "Commutative Property!",
      text: "Order doesn't matter in multiplication! 3 × 7 = 7 × 3 = 21. You can flip numbers to make it easier!",
    },
    {
      number: 7,
      title: "Ten's Power!",
      text: "To multiply by 10, just add a zero! To multiply by 100, add two zeros! Example: 23 × 10 = 230, 23 × 100 = 2,300",
    },
    {
      number: 8,
      title: "Break It Down!",
      text: "Break big numbers into smaller parts! 12 × 15 = 12 × (10 + 5) = (12 × 10) + (12 × 5) = 120 + 60 = 180",
    },
    {
      number: 9,
      title: "Square Numbers!",
      text: "When multiplying a number by itself, it's called squaring! 5² = 5 × 5 = 25. Perfect squares are special!",
    },
    {
      number: 10,
      title: "Even × Odd Pattern!",
      text: "Even × Even = Even, Odd × Odd = Odd, Even × Odd = Even. Remember these patterns to check your work!",
    },
  ];

  useEffect(() => {
    Font.loadAsync({
      BernerBasisschrift1: require("../assets/fonts/BernerBasisschrift1.ttf"),
    }).then(() => setFontsLoaded(true));

    // Select a random tip
    const randomTip =
      multiplicationTips[Math.floor(Math.random() * multiplicationTips.length)];
    setCurrentTip(randomTip);

    // Load actual question results
    loadQuestionResults();
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
      Animated.spring(headerScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scoreScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded]);

  const loadQuestionResults = async () => {
    try {
      // Get session data to retrieve questions
      const sessionDoc = await getDoc(doc(db, "sessions", sessionId));
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        const questions = sessionData.questions || [];

        // Find this student's answers
        const studentAnswers = sessionData.studentAnswers?.[studentId] || {};

        // Create question results array
        const results = questions.map((question, index) => {
          const studentAnswer = studentAnswers[index];
          const isCorrect = studentAnswer === question.answer;

          return {
            question: `${question.num1} × ${question.num2} = ?`,
            userAnswer: studentAnswer || "No answer",
            correctAnswer: question.answer,
            isCorrect: isCorrect,
          };
        });

        setQuestionResults(results);
      }
    } catch (error) {
      console.error("Error loading question results:", error);
      // Fallback to mock data if there's an error
      setQuestionResults([
        {
          question: "7 × 8 = ?",
          userAnswer: "56",
          correctAnswer: "56",
          isCorrect: true,
        },
        {
          question: "9 × 6 = ?",
          userAnswer: "54",
          correctAnswer: "54",
          isCorrect: true,
        },
        {
          question: "12 × 4 = ?",
          userAnswer: "46",
          correctAnswer: "48",
          isCorrect: false,
        },
        {
          question: "8 × 7 = ?",
          userAnswer: "56",
          correctAnswer: "56",
          isCorrect: true,
        },
        {
          question: "11 × 3 = ?",
          userAnswer: "33",
          correctAnswer: "33",
          isCorrect: true,
        },
        {
          question: "6 × 9 = ?",
          userAnswer: "52",
          correctAnswer: "54",
          isCorrect: false,
        },
        {
          question: "5 × 12 = ?",
          userAnswer: "60",
          correctAnswer: "60",
          isCorrect: true,
        },
        {
          question: "13 × 2 = ?",
          userAnswer: "26",
          correctAnswer: "26",
          isCorrect: true,
        },
        {
          question: "4 × 15 = ?",
          userAnswer: "60",
          correctAnswer: "60",
          isCorrect: true,
        },
        {
          question: "8 × 9 = ?",
          userAnswer: "70",
          correctAnswer: "72",
          isCorrect: false,
        },
      ]);
    }
  };

  const toggleMusic = () => {
    setIsMusicOn(!isMusicOn);
  };

  const handleHomePress = () => {
    navigation.navigate("TitleScreen");
  };

  if (!fontsLoaded || !currentTip) {
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Calculate stats
  const totalQuestions = questionResults.length;
  const correctAnswers = questionResults.filter((q) => q.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const accuracy =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;
  const timeSpent = studentData?.totalTime
    ? Math.round(studentData.totalTime / 1000 / 60)
    : 0;

  // Calculate streak (consecutive correct answers)
  let maxStreak = 0;
  let currentStreak = 0;

  questionResults.forEach((result) => {
    if (result.isCorrect) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return "🌟 Outstanding!";
    if (accuracy >= 80) return "🎉 Excellent!";
    if (accuracy >= 70) return "👍 Great Job!";
    if (accuracy >= 60) return "💪 Good Work!";
    return "🎯 Keep Practicing!";
  };

  const getPerformanceColor = () => {
    if (accuracy >= 80) return ["#10b981", "#059669"];
    if (accuracy >= 60) return ["#f97316", "#facc15"];
    return ["#ef4444", "#dc2626"];
  };

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
          <Text style={styles.headerIcon}>📊</Text>
          <Text style={styles.headerText}>YOUR RESULTS</Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Card */}
        <Animated.View
          style={[styles.scoreCard, { transform: [{ scale: scoreScale }] }]}
        >
          <LinearGradient
            colors={getPerformanceColor()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCardGradient}
          >
            <Text style={styles.celebrationIcon}>
              {accuracy >= 90
                ? "🏆"
                : accuracy >= 70
                ? "🎉"
                : accuracy >= 50
                ? "👍"
                : "💪"}
            </Text>
            <Text style={styles.scorePercentage}>{accuracy}%</Text>
            <Text style={styles.scoreLabel}>{getPerformanceMessage()}</Text>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreDetailText}>
                {correctAnswers} / {totalQuestions} Correct
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="✅"
            number={correctAnswers}
            label="Correct"
            delay={0}
            color={["#10b981", "#059669"]}
          />
          <StatCard
            icon="❌"
            number={incorrectAnswers}
            label="Incorrect"
            delay={100}
            color={["#ef4444", "#dc2626"]}
          />
          <StatCard
            icon="⏱️"
            number={`${timeSpent}m`}
            label="Time Spent"
            delay={200}
            color={["#667eea", "#764ba2"]}
          />
          <StatCard
            icon="🔥"
            number={maxStreak}
            label="Best Streak"
            delay={300}
            color={["#f97316", "#facc15"]}
          />
        </View>

        {/* Pro Tips Card */}
        <TipCard tip={currentTip} delay={400} />

        {/* Problem Review */}
        <View style={styles.problemReviewCard}>
          <View style={styles.reviewHeader}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reviewHeaderGradient}
            >
              <Text style={styles.reviewIcon}>📝</Text>
              <Text style={styles.reviewTitle}>Problem Review</Text>
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>{totalQuestions}</Text>
              </View>
            </LinearGradient>
          </View>

          {questionResults.length === 0 ? (
            <View style={styles.noQuestionsContainer}>
              <Text style={styles.noQuestionsIcon}>📚</Text>
              <Text style={styles.noQuestionsText}>
                No questions available to review
              </Text>
            </View>
          ) : (
            questionResults.map((result, index) => (
              <ProblemItem key={index} result={result} index={index} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Home Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHomePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#10b981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonIcon}>🏠</Text>
            <Text style={styles.buttonText}>BACK TO HOME</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Stat Card Component
function StatCard({ icon, number, label, delay, color }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}
    >
      <LinearGradient
        colors={color}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCardGradient}
      >
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statNumber}>{number}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// Tip Card Component
function TipCard({ tip, delay }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.tipCard, { transform: [{ scale: scaleAnim }] }]}
    >
      <LinearGradient
        colors={["#FFD700", "#FFA500"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tipHeader}
      >
        <Text style={styles.tipHeaderIcon}>💡</Text>
        <Text style={styles.tipHeaderText}>Pro Tip!</Text>
      </LinearGradient>
      <View style={styles.tipContent}>
        <View style={styles.tipNumberBadge}>
          <Text style={styles.tipNumberText}>TIP #{tip.number}</Text>
        </View>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipText}>{tip.text}</Text>
      </View>
    </Animated.View>
  );
}

// Problem Item Component
function ProblemItem({ result, index }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.problemItem, { transform: [{ scale: scaleAnim }] }]}
    >
      <View
        style={[
          styles.problemStatusBadge,
          { backgroundColor: result.isCorrect ? "#10b981" : "#ef4444" },
        ]}
      >
        <Text style={styles.problemStatusIcon}>
          {result.isCorrect ? "✓" : "✗"}
        </Text>
      </View>
      <View style={styles.problemContent}>
        <Text style={styles.problemQuestion}>{result.question}</Text>
        <View style={styles.problemAnswers}>
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Your answer:</Text>
            <Text
              style={[
                styles.answerValue,
                { color: result.isCorrect ? "#10b981" : "#ef4444" },
              ]}
            >
              {result.userAnswer}
            </Text>
          </View>
          {!result.isCorrect && (
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Correct answer:</Text>
              <Text style={[styles.answerValue, { color: "#10b981" }]}>
                {result.correctAnswer}
              </Text>
            </View>
          )}
        </View>
      </View>
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
    paddingHorizontal: 32,
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
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  scoreCard: {
    marginBottom: 20,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  scoreCardGradient: {
    padding: 32,
    alignItems: "center",
  },
  celebrationIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 72,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  scoreLabel: {
    fontSize: 24,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#fff",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreDetails: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  scoreDetailText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  statCardGradient: {
    padding: 20,
    alignItems: "center",
  },
  statIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  tipCard: {
    marginBottom: 20,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  tipHeaderIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tipHeaderText: {
    flex: 1,
    fontSize: 22,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tipContent: {
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  tipNumberBadge: {
    backgroundColor: "#FFD700",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  tipNumberText: {
    fontSize: 12,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#fff",
  },
  tipTitle: {
    fontSize: 20,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#f97316",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 16,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "600",
    color: "#333",
    lineHeight: 24,
  },
  problemReviewCard: {
    marginBottom: 20,
  },
  reviewHeader: {
    marginBottom: 16,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  reviewHeaderGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  reviewIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reviewTitle: {
    flex: 1,
    fontSize: 22,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  reviewBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  reviewBadgeText: {
    fontSize: 16,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#fff",
  },
  problemItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  problemStatusBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  problemStatusIcon: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  problemContent: {
    flex: 1,
  },
  problemQuestion: {
    fontSize: 18,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#333",
    marginBottom: 8,
  },
  problemAnswers: {
    gap: 4,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  answerLabel: {
    fontSize: 14,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    color: "#666",
    marginRight: 8,
  },
  answerValue: {
    fontSize: 16,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
  },
  noQuestionsContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#e0e0e0",
  },
  noQuestionsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noQuestionsText: {
    fontSize: 18,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  homeButton: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
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
  loadingText: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
