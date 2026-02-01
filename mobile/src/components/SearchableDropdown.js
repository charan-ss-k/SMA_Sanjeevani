/**
 * Searchable Dropdown Component
 * Dropdown with search/filter functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '../utils/theme';

const SearchableDropdown = ({
  items = [],
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  label,
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredItems(items);
    } else {
      // Filter items that start with the typed text (case insensitive)
      const filtered = items.filter((item) =>
        item.toLowerCase().startsWith(text.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  const handleSelect = (item) => {
    onValueChange(item);
    setSearchText('');
    setFilteredItems(items);
    setIsVisible(false);
  };

  const openDropdown = () => {
    setIsVisible(true);
    setFilteredItems(items);
    setSearchText('');
  };

  const handleClear = () => {
    onValueChange('');
    setSearchText('');
    setFilteredItems(items);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        style={styles.trigger}
        onPress={openDropdown}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedValue && styles.placeholderText,
          ]}
        >
          {selectedValue || placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </Pressable>
      {selectedValue && (
        <Pressable 
          style={[
            styles.clearButton,
            { top: label ? 38 : 12 }
          ]} 
          onPress={handleClear}
        >
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      )}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsVisible(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || placeholder}</Text>
              <Pressable
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={handleSearch}
                placeholder="Type to search..."
                placeholderTextColor={colors.textLight}
                autoFocus
              />
              {searchText && (
                <Pressable
                  onPress={() => {
                    setSearchText('');
                    setFilteredItems(items);
                  }}
                  style={styles.searchClear}
                >
                  <Text style={styles.searchClearText}>✕</Text>
                </Pressable>
              )}
            </View>
            <FlatList
              data={filteredItems}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.item,
                    item === selectedValue && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.itemText,
                      item === selectedValue && styles.selectedItemText,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === selectedValue && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No results found for "{searchText}"
                  </Text>
                </View>
              }
              style={styles.list}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textLight,
  },
  arrow: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  clearButton: {
    position: 'absolute',
    right: 35,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 12,
  },
  clearText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.gray[50],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.gray[200],
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  searchClear: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.gray[200],
  },
  searchClearText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
  },
  list: {
    maxHeight: 400,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  selectedItem: {
    backgroundColor: colors.secondary + '15',
  },
  itemText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  selectedItemText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: colors.secondary,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default SearchableDropdown;
