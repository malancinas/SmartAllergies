import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: number[];
  children: React.ReactNode;
  testID?: string;
  backgroundColor?: string;
}

export function BottomSheet({ visible, onClose, snapPoints = [0.5], children, testID, backgroundColor = 'white' }: BottomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const defaultHeight = SCREEN_HEIGHT * (snapPoints[0] ?? 0.5);

  // Controls actual Modal visibility; trails the parent prop so exit animation plays out first.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      // Animate out, then unmount — do NOT call onClose here.
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const animatedSheet = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdrop = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} testID={testID}>
      <View className="flex-1" style={{ position: 'relative' }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }, animatedBackdrop]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: defaultHeight,
              backgroundColor,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            },
            animatedSheet,
          ]}
        >
          <View className="items-center pt-3 pb-2">
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: backgroundColor === 'white' ? '#d1d5db' : 'rgba(255,255,255,0.15)' }} />
          </View>
          <View className="flex-1 px-4 pb-4">{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}
