import React, { useEffect, useRef } from 'react';
import { Text, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  duration?: number;
  style?: any;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
}

export function AnimatedCounter({
  value,
  prefix = '₹',
  duration = 800,
  style,
  fontSize = 36,
  fontWeight = '800',
  color,
}: AnimatedCounterProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState('0');

  useEffect(() => {
    animatedValue.setValue(0);
    const animation = Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    });
    animation.start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(
        v.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    });

    return () => animatedValue.removeListener(listener);
  }, [value, duration, animatedValue]);

  return (
    <Text
      style={[
        { fontFamily: 'PlusJakartaSans', fontSize, fontWeight, color: color || '#FFFFFF' },
        style,
      ]}
    >
      {prefix}{displayValue}
    </Text>
  );
}
