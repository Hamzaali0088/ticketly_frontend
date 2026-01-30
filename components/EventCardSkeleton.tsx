import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

export const EventCardSkeleton: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.card}>
      {/* Image area */}
      <Animated.View style={[styles.imageBlock, { opacity }]} />
      {/* Price pill */}
      <View style={styles.pricePill}>
        <Animated.View style={[styles.pricePillInner, { opacity }]} />
      </View>
      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.lineShort, { opacity }]} />
        <Animated.View style={[styles.lineTitle1, { opacity }]} />
        <Animated.View style={[styles.lineTitle2, { opacity }]} />
        <View style={styles.hostRow}>
          <Animated.View style={[styles.avatar, { opacity }]} />
          <Animated.View style={[styles.lineHost, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageBlock: {
    width: '100%',
    height: 150,
    backgroundColor: '#2A2A2A',
  },
  pricePill: {
    position: 'absolute',
    bottom: 150 - 28,
    left: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  pricePillInner: {
    width: 36,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#3F3F3F',
  },
  content: {
    padding: 12,
  },
  lineShort: {
    height: 10,
    width: '55%',
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
    marginBottom: 8,
  },
  lineTitle1: {
    height: 12,
    width: '95%',
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
    marginBottom: 6,
  },
  lineTitle2: {
    height: 12,
    width: '70%',
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
    marginBottom: 10,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    marginRight: 8,
  },
  lineHost: {
    height: 10,
    width: 60,
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
  },
});
