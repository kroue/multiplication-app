import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

const { width, height } = Dimensions.get("window");

const quizPlayers = [
  require("../assets/player1.png"),
  require("../assets/player2.png"),
  require("../assets/player3.png"),
  require("../assets/player4.png"),
];

export default function QuizScreen({ route, navigation }) {
  const { sessionId, studentId, studentName, selectedCharacter } = route.params;
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showCheck, setShowCheck] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [questionStartTimes, setQuestionStartTimes] = useState({});
  const [questionResults, setQuestionResults] = useState([]);
  const TIMER_DURATION = 50;
  const [timer, setTimer] = useState(TIMER_DURATION);
  const intervalRef = useRef();
  const timeoutRef = useRef();

  // Animation values
  const [floatingElements] = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      symbol: ["💡", "⭐", "✨", "🎯", "🚀"][Math.floor(Math.random() * 5)],
      animValue: new Animated.Value(0),
      left: Math.random() * 100,
      duration: 10000 + Math.random() * 5000,
      delay: Math.random() * 3000,
      size: 20 + Math.random() * 10,
    }))
  );

  const questionScale = useRef(new Animated.Value(0)).current;
  const optionsSlide = useRef(new Animated.Value(50)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const characterBounce = useRef(new Animated.Value(0)).current;

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
  }, [fontsLoaded]);

  // Animate new question
  useEffect(() => {
    if (!fontsLoaded) return;

    questionScale.setValue(0);
    optionsSlide.setValue(50);
    characterBounce.setValue(0);

    Animated.sequence([
      Animated.spring(questionScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(optionsSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Character bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(characterBounce, {
          toValue: -10,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(characterBounce, {
          toValue: 0,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [currentIdx, fontsLoaded]);

  // Timer pulse effect
  useEffect(() => {
    if (timer <= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulse, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      timerPulse.setValue(1);
    }
  }, [timer]);

  // Track question start time
  useEffect(() => {
    setQuestionStartTimes((prev) => ({
      ...prev,
      [currentIdx]: Date.now(),
    }));
  }, [currentIdx]);

  // Function to save score and navigate to ranking
  const finishQuiz = async () => {
    try {
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const sessionRef = doc(db, "sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      const sessionData = sessionSnap.data();

      // Calculate detailed analytics
      const playerResult = {
        studentId,
        name: studentName,
        score,
        totalQuestions: questions.length,
        correctAnswers: score,
        incorrectAnswers: questions.length - score,
        accuracy: (score / questions.length) * 100,
        totalTime,
        averageTimePerQuestion: totalTime / questions.length,
        finishedAt: endTime,
        questionResults: questionResults,
        level: sessionData.level,
      };

      // Remove existing score for this student
      const currentScores = sessionData?.scores || [];
      const filteredScores = currentScores.filter(
        (s) => s.studentId !== studentId
      );

      // Update session with comprehensive data
      await updateDoc(sessionRef, {
        scores: [...filteredScores, playerResult],
        lastUpdated: endTime,
      });

      navigation.navigate("RankingScreen", {
        sessionId,
        studentId,
        studentName,
      });
    } catch (error) {
      console.error("Error saving session data:", error);
      navigation.navigate("RankingScreen", {
        sessionId,
        studentId,
        studentName,
      });
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const sessionDoc = await getDoc(doc(db, "sessions", sessionId));
        if (!sessionDoc.exists()) {
          console.error("Session not found!");
          return;
        }

        const sessionData = sessionDoc.data();
        const level = sessionData.level;
        const levelKey = level?.toLowerCase().replace(" ", "-");
        const teacherUid = "rTPhhHNRT5gMWFsZWdrtmpUVhWd2";

        if (!levelKey) {
          console.error("Level key is empty!");
          return;
        }

        const snap = await getDocs(
          collection(db, "questions", teacherUid, levelKey)
        );
        const arr = [];
        snap.forEach((doc) => {
          const data = doc.data();
          const options = Array.isArray(data.options) ? data.options : [];
          arr.push({
            ...data,
            id: doc.id,
            options: options.map((opt, idx) => ({
              key: String.fromCharCode(65 + idx),
              value: opt || "",
              color: ["#FFE5E5", "#E5F5FF", "#FFF5E5", "#E5FFE5"][idx % 4],
            })),
          });
        });
        setQuestions(arr);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [sessionId]);

  // Track question results
  const recordQuestionResult = (questionId, question, isCorrect, timeTaken) => {
    const result = {
      questionId,
      question,
      isCorrect,
      timeTaken,
      answeredAt: Date.now(),
    };
    setQuestionResults((prev) => [...prev, result]);
  };

  // Handle text answer submission
  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentIdx];
    const timeTaken =
      Date.now() - (questionStartTimes[currentIdx] || Date.now());

    if (currentQuestion && currentQuestion.type === "singleAnswer") {
      clearInterval(intervalRef.current);
      const isCorrect =
        String(textAnswer).trim() === String(currentQuestion.answer).trim();

      // Record question result
      recordQuestionResult(
        currentQuestion.id,
        currentQuestion.question,
        isCorrect,
        timeTaken
      );

      if (isCorrect) {
        setScore((prev) => prev + 1);
        setShowCheck(true);
      } else {
        setShowWrong(true);
      }

      timeoutRef.current = setTimeout(() => {
        setShowCheck(false);
        setShowWrong(false);
        setTextAnswer("");
        if (currentIdx < questions.length - 1) {
          setCurrentIdx((idx) => idx + 1);
        } else {
          finishQuiz();
        }
      }, 1200);
    }
  };

  // SINGLE Timer effect - reset on question change and handle countdown
  useEffect(() => {
    setTimer(TIMER_DURATION);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setShowWrong(true);

          timeoutRef.current = setTimeout(() => {
            setShowWrong(false);
            setSelected(null);
            setTextAnswer("");
            if (currentIdx < questions.length - 1) {
              setCurrentIdx((idx) => idx + 1);
            } else {
              finishQuiz();
            }
          }, 1200);

          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIdx, questions.length]);

  // Handle multiple choice selection
  useEffect(() => {
    if (selected !== null && questions.length > 0) {
      clearInterval(intervalRef.current);
      const correctIdx = questions[currentIdx]?.correct;
      const currentQuestion = questions[currentIdx];
      const timeTaken =
        Date.now() - (questionStartTimes[currentIdx] || Date.now());
      const isCorrect = selected === correctIdx;

      // Record question result
      recordQuestionResult(
        currentQuestion.id,
        currentQuestion.question,
        isCorrect,
        timeTaken
      );

      if (isCorrect) {
        setScore((prev) => prev + 1);
        setShowCheck(true);
      } else {
        setShowWrong(true);
      }

      timeoutRef.current = setTimeout(() => {
        setShowCheck(false);
        setShowWrong(false);
        setSelected(null);
        if (currentIdx < questions.length - 1) {
          setCurrentIdx((idx) => idx + 1);
        } else {
          finishQuiz();
        }
      }, 1200);
    }
  }, [selected, questions, currentIdx]);

  if (!fontsLoaded || loading || !questions.length) {
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
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  const q = questions[currentIdx];
  if (!q) return null;

  const characterImg = quizPlayers[selectedCharacter || 0];
  const timerBarMaxWidth = width - 40;
  const timerBarWidth = (timer / TIMER_DURATION) * timerBarMaxWidth;
  const timerColor =
    timer <= 10 ? "#ef4444" : timer <= 20 ? "#f97316" : "#10b981";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#4fd1ff", "#5b9cf5", "#ff5fcf"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.scoreContainer}>
            <LinearGradient
              colors={["#f97316", "#facc15"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreBadge}
            >
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </LinearGradient>
          </View>

          <View style={styles.questionNumberContainer}>
            <View style={styles.questionNumberBadge}>
              <Text style={styles.questionNumberText}>
                {currentIdx + 1} / {questions.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Character */}
        <Animated.View
          style={[
            styles.characterContainer,
            { transform: [{ translateY: characterBounce }] },
          ]}
        >
          <View style={styles.characterCircle}>
            <Image
              source={characterImg}
              style={styles.characterImg}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Question Box */}
        <Animated.View
          style={[
            styles.questionContainer,
            { transform: [{ scale: questionScale }] },
          ]}
        >
          <LinearGradient
            colors={["#ffffff", "#f8fafc"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.questionBox}
          >
            <Text style={styles.questionLabel}>❓ Question</Text>
            <Text style={styles.questionText}>{q.question}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Timer Bar */}
        <Animated.View
          style={[
            styles.timerContainer,
            { transform: [{ scale: timerPulse }] },
          ]}
        >
          <View style={styles.timerBarBg}>
            <Animated.View
              style={[
                styles.timerBarFill,
                {
                  width: timerBarWidth,
                  backgroundColor: timerColor,
                },
              ]}
            />
          </View>
          <View style={[styles.timerBadge, { backgroundColor: timerColor }]}>
            <Text style={styles.timerText}>⏱️ {timer}s</Text>
          </View>
        </Animated.View>

        {/* Answer Section */}
        {q.type === "singleAnswer" ? (
          <Animated.View
            style={[
              styles.answerInputContainer,
              { transform: [{ translateY: optionsSlide }] },
            ]}
          >
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✏️</Text>
              <TextInput
                style={styles.answerInput}
                value={textAnswer}
                onChangeText={setTextAnswer}
                keyboardType="numeric"
                placeholder="Type your answer..."
                placeholderTextColor="#999"
                editable={!showCheck && !showWrong}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (showCheck || showWrong) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitAnswer}
              disabled={showCheck || showWrong || !textAnswer.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
                <Text style={styles.submitButtonIcon}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.optionsContainer,
              { transform: [{ translateY: optionsSlide }] },
            ]}
          >
            {(q.options || []).map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionBtn,
                  { backgroundColor: opt.color || "#f0f0f0" },
                  selected === idx && styles.selectedBtn,
                ]}
                onPress={() => setSelected(idx)}
                activeOpacity={0.8}
                disabled={showCheck || showWrong}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionKey}>
                    <Text style={styles.optionKeyText}>{opt.key}</Text>
                  </View>
                  <Text style={styles.optionText}>{opt.value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Correct/Wrong Overlay */}
      {showCheck && (
        <View style={styles.fullScreenOverlay}>
          <Animated.View
            style={[styles.feedbackContainer, { opacity: questionScale }]}
          >
            <Image
              source={require("../assets/correct.png")}
              style={styles.feedbackImg}
              resizeMode="contain"
            />
            <Text style={styles.feedbackText}>🎉 Correct!</Text>
          </Animated.View>
        </View>
      )}

      {showWrong && (
        <View style={styles.fullScreenOverlay}>
          <Animated.View
            style={[styles.feedbackContainer, { opacity: questionScale }]}
          >
            <Image
              source={require("../assets/wrong.png")}
              style={styles.feedbackImg}
              resizeMode="contain"
            />
            <Text style={styles.feedbackText}>❌ Try Again!</Text>
          </Animated.View>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  floatingSymbol: {
    position: "absolute",
    opacity: 0.6,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    zIndex: 10,
  },
  scoreContainer: {
    flex: 1,
  },
  scoreBadge: {
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    alignItems: "center",
    maxWidth: 120,
  },
  scoreLabel: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    marginBottom: 2,
  },
  scoreValue: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  questionNumberContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  questionNumberBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  questionNumberText: {
    color: "#f97316",
    fontSize: 18,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
  },
  characterContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  characterCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  characterImg: {
    width: 80,
    height: 80,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionBox: {
    borderRadius: 25,
    padding: 24,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 140,
  },
  questionLabel: {
    fontSize: 16,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    color: "#f97316",
    marginBottom: 12,
  },
  questionText: {
    fontSize: 22,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    color: "#333",
    lineHeight: 32,
  },
  timerContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  timerBarBg: {
    width: "100%",
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  timerBarFill: {
    height: "100%",
    borderRadius: 8,
  },
  timerBadge: {
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  timerText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
  },
  answerInputContainer: {
    width: "100%",
    alignItems: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    width: "100%",
    borderWidth: 3,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  inputIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  answerInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    paddingVertical: 0,
  },
  submitButton: {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    marginRight: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  submitButtonIcon: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  optionsContainer: {
    width: "100%",
  },
  optionBtn: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedBtn: {
    borderWidth: 5,
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOpacity: 0.4,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionKey: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionKeyText: {
    color: "#333",
    fontSize: 20,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
  },
  optionText: {
    flex: 1,
    color: "#333",
    fontSize: 20,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    lineHeight: 28,
  },
  fullScreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  feedbackContainer: {
    alignItems: "center",
  },
  feedbackImg: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 20,
  },
  feedbackText: {
    color: "#fff",
    fontSize: 36,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
