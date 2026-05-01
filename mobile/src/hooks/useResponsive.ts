import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export function useResponsive() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS !== 'web';
  const isTablet = dimensions.width >= 768;
  const isSmallScreen = dimensions.width < 375;

  const isNarrowScreen = dimensions.width < 600;

  const maxContentWidth = (isNarrowScreen ? '100%' : dimensions.width < 900 ? '90%' : 800) as number | string;
  const contentPadding = isNarrowScreen ? 16 : 24;

  return {
    isWeb,
    isMobile,
    isTablet,
    isSmallScreen,
    isNarrowScreen,
    width: dimensions.width,
    height: dimensions.height,
    maxContentWidth,
    contentPadding,
  };
}
