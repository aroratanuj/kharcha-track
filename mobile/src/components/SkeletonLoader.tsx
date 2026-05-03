import React from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const animated = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animated, { toValue: 1, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(animated, { toValue: 0, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated]);

  const opacity = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.4],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.skeleton, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.row}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="60%" height={14} borderRadius={4} />
          <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={70} height={18} borderRadius={4} />
      </View>
    </View>
  );
}

export function SkeletonHero() {
  const { colors } = useTheme();
  return (
    <View style={[s.hero, { backgroundColor: colors.primary }]}>
      <Skeleton width="50%" height={14} borderRadius={4} />
      <Skeleton width="70%" height={36} borderRadius={4} style={{ marginTop: 12 }} />
      <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonCategoryBar() {
  return (
    <View style={s.catRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: 110 }}>
        <Skeleton width={20} height={20} borderRadius={10} />
        <Skeleton width={60} height={13} borderRadius={4} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Skeleton width="100%" height={8} borderRadius={4} />
        <Skeleton width={50} height={12} borderRadius={4} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hero: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
});
