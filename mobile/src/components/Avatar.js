/**
 * Avatar Component
 * User profile picture or initials
 */

import React from 'react';
import { View, Text, Image, Pressable, TouchableOpacity } from 'react-native';
import { colors, borderRadius } from '../utils/theme';
import { getInitials } from '../utils/helpers';

export const Avatar = ({
  source = null,
  initials = null,
  name = null,
  size = 'md', // sm, md, lg
  backgroundColor = colors.secondary,
  onPress = null,
}) => {
  const sizes = {
    sm: { width: 40, height: 40, fontSize: 12 },
    md: { width: 60, height: 60, fontSize: 16 },
    lg: { width: 100, height: 100, fontSize: 20 },
  };

  const sizeStyle = sizes[size];

  const getDisplayInitials = () => {
    if (initials) return initials;
    if (name) return getInitials(name);
    return 'U';
  };

  const avatarContent = (
    <View
      style={{
        width: sizeStyle.width,
        height: sizeStyle.height,
        borderRadius: sizeStyle.width / 2,
        overflow: 'hidden',
        backgroundColor: backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {source ? (
        <Image
          source={source}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      ) : (
        <Text
          style={{
            fontSize: sizeStyle.fontSize,
            fontWeight: 'bold',
            color: colors.white,
          }}
        >
          {getDisplayInitials()}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
};

export default Avatar;
