import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Image,
  Animated,
  Easing,
  Dimensions,
  TextInput,
} from "react-native";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";

const { width } = Dimensions.get("window");

export default function NameScreen({ navigation, route }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wrongPassword, setWrongPassword] = useState(
    route?.params?.wrongPassword || false
  );
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [floatingElements] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      symbol: ["📚", "✏️", "📝", "🎨", "⭐"][Math.floor(Math.random() * 5)],
      animValue: new Animated.Value(0),
      left: Math.random() * 100,
      duration: 10000 + Math.random() * 5000,
      delay: Math.random() * 3000,
      size: 20 + Math.random() * 15,
    }))
  );

  const headerScale = useRef(new Animated.Value(0)).current;
  const popupSlide = useRef(new Animated.Value(-100)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;

  const { sessionId, level, playerId, code, selectedCharacter } =
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

    // Header scale in
    Animated.spring(headerScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [fontsLoaded]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        console.log(
          "Fetching students from path: students/rTPhhHNRT5gMWFsZWdrtmpUVhWd2/list"
        );

        const studentsRef = collection(
          db,
          "students",
          "rTPhhHNRT5gMWFsZWdrtmpUVhWd2",
          "list"
        );
        const snap = await getDocs(studentsRef);

        const arr = [];
        snap.forEach((doc) => {
          console.log("Student doc:", doc.id, doc.data());
          arr.push({ ...doc.data(), id: doc.id });
        });

        console.log("Fetched students:", arr);
        setStudents(arr);
      } catch (error) {
        console.error("Error fetching students:", error);
        alert(
          "Unable to load student list. Please check your connection and try again."
        );
      }
      setLoading(false);
    }

    fetchStudents();
  }, []);

  useEffect(() => {
    if (wrongPassword) {
      // Animate popup in
      Animated.parallel([
        Animated.spring(popupSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(popupOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Shake animation
      const shakeValue = new Animated.Value(0);
      Animated.sequence([
        Animated.timing(shakeValue, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(popupSlide, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(popupOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setWrongPassword(false));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [wrongPassword]);

  const toggleMusic = () => {
    setIsMusicOn(!isMusicOn);
  };

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstname} ${student.lastname}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (!fontsLoaded || loading) {
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
        <Text style={styles.loadingText}>Loading students...</Text>
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

      {/* Wrong Password Popup */}
      {wrongPassword && (
        <Animated.View
          style={[
            styles.popup,
            {
              transform: [{ translateY: popupSlide }],
              opacity: popupOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={["#ff6b6b", "#ee5a6f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.popupGradient}
          >
            <Text style={styles.popupIcon}>⚠️</Text>
            <Text style={styles.popupText}>Wrong Password! Try Again</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Header */}
      <Animated.View
        style={[styles.header, { transform: [{ scale: headerScale }] }]}
      >
        {/* Selected Character Display */}
        {selectedCharacter !== null && selectedCharacter !== undefined && (
          <View style={styles.characterDisplay}>
            <Image
              source={characterImages[selectedCharacter]}
              style={styles.selectedCharacterImg}
              resizeMode="contain"
            />
          </View>
        )}

        <LinearGradient
          colors={["#f97316", "#facc15"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.headerBox}
        >
          <Text style={styles.headerText}>Select Your Name</Text>
        </LinearGradient>

        <View style={styles.sessionInfoBox}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoLabel}>Session:</Text>
            <Text style={styles.infoValue}>{code}</Text>
          </View>
          <View style={[styles.infoBadge, { marginLeft: 12 }]}>
            <Text style={styles.infoLabel}>Level:</Text>
            <Text style={styles.infoValue}>{level}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your name..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <View style={styles.noStudentsContainer}>
          <Text style={styles.noStudentsIcon}>{searchQuery ? "🔍" : "📚"}</Text>
          <Text style={styles.noStudentsText}>
            {searchQuery
              ? `No students found matching "${searchQuery}"`
              : "No students found.\nPlease contact your teacher."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.nameList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <StudentCard
              item={item}
              index={index}
              navigation={navigation}
              sessionId={sessionId}
              level={level}
              playerId={playerId}
              code={code}
              selectedCharacter={selectedCharacter}
            />
          )}
        />
      )}
    </View>
  );
}

// Separate component for student card with animation
function StudentCard({
  item,
  index,
  navigation,
  sessionId,
  level,
  playerId,
  code,
  selectedCharacter,
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate("PasswordScreen", {
        studentId: item.id,
        sessionId,
        level,
        playerId,
        code,
        selectedCharacter,
      });
    });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.nameBox}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.studentAvatar}>
          <Text style={styles.avatarText}>
            {item.firstname?.charAt(0)}
            {item.lastname?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.nameText}>
          {item.firstname} {item.lastname}
        </Text>
        <View style={styles.arrowCircle}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </TouchableOpacity>
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
  popup: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 100,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 15,
  },
  popupGradient: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 4,
    borderColor: "#fff",
    borderRadius: 25,
  },
  popupIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  popupText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  header: {
    paddingTop: 120,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    zIndex: 10,
  },
  characterDisplay: {
    marginBottom: 16,
    alignItems: "center",
  },
  selectedCharacterImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerBox: {
    borderRadius: 30,
    paddingHorizontal: 36,
    paddingVertical: 14,
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
    fontSize: 28,
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
    marginTop: 12,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 5,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 3,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "600",
    color: "#333",
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  clearIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  nameList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nameBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 3,
    borderColor: "#e0e0e0",
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f97316",
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
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "BernerBasisschrift1",
  },
  nameText: {
    flex: 1,
    color: "#333",
    fontSize: 20,
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  arrowCircle: {
    backgroundColor: "#facc15",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  arrowText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  noStudentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noStudentsIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  noStudentsText: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
    fontFamily: "BernerBasisschrift1",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    lineHeight: 32,
  },
  loadingText: {
    color: "#fff",
    marginTop: 20,
    fontFamily: "BernerBasisschrift1",
    fontSize: 18,
    fontWeight: "700",
  },
});
