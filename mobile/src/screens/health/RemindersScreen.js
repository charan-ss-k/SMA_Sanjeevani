/**
 * Reminders Screen
 * Manage medication reminders
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useHealth } from '../../context/HealthContext';
import { Button, Card, Alert, Loading, Badge } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';

const ReminderCard = ({ reminder, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'skipped':
        return colors.warning;
      case 'taken':
        return colors.primary;
      default:
        return colors.gray[400];
    }
  };

  return (
    <Card variant="elevated" padding="md" style={{ marginBottom: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.h4,
              {
                color: colors.text,
                marginBottom: spacing.xs,
              },
            ]}
          >
            {reminder.medicineName}
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                marginBottom: spacing.sm,
              },
            ]}
          >
            {reminder.dosage} • {reminder.frequency}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Text style={{ color: colors.textSecondary }}>⏰</Text>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {reminder.time}
            </Text>
          </View>
        </View>
        <Badge variant={reminder.status === 'active' ? 'success' : 'default'}>
          {reminder.status}
        </Badge>
      </View>

      <View
        style={{
          backgroundColor: colors.gray[50],
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: 6,
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          📋 {reminder.notes || 'No special notes'}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
        }}
      >
        <Button
          title="Edit"
          onPress={() => onEdit(reminder)}
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
        />
        <Button
          title="Delete"
          onPress={() => onDelete(reminder.id)}
          variant="danger"
          size="sm"
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
};

const AddReminderModal = ({ visible, onClose, onAdd, isLoading }) => {
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [time, setTime] = useState('08:00 AM');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!medicineName.trim() || !dosage.trim()) {
      alert('Please fill all fields');
      return;
    }

    onAdd({
      medicineName,
      dosage,
      frequency,
      time,
      notes,
    });

    // Reset form
    setMedicineName('');
    setDosage('');
    setFrequency('Once daily');
    setTime('08:00 AM');
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <Text
              style={[
                typography.h3,
                {
                  color: colors.text,
                },
              ]}
            >
              Add Reminder
            </Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 24, fontWeight: 'bold' }}>✕</Text>
            </Pressable>
          </View>
          <Text
            style={[
              typography.labelSmall,
              {
                color: colors.text,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Medicine Name
          </Text>
          <TextInput
            value={medicineName}
            onChangeText={setMedicineName}
            placeholder="e.g., Aspirin"
            placeholderTextColor={colors.textLight}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              marginBottom: spacing.lg,
              color: colors.text,
            }}
          />
          <Text
            style={[
              typography.labelSmall,
              {
                color: colors.text,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Dosage
          </Text>
          <TextInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g., 500mg"
            placeholderTextColor={colors.textLight}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              marginBottom: spacing.lg,
              color: colors.text,
            }}
          />
          <Text
            style={[
              typography.labelSmall,
              {
                color: colors.text,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Frequency
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <Text style={{ color: colors.text }}>{frequency}</Text>
          </View>
          <Text
            style={[
              typography.labelSmall,
              {
                color: colors.text,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Reminder Time
          </Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="08:00 AM"
            placeholderTextColor={colors.textLight}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              marginBottom: spacing.lg,
              color: colors.text,
            }}
          />
          <Text
            style={[
              typography.labelSmall,
              {
                color: colors.text,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Take with food, etc."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              marginBottom: spacing.lg,
              color: colors.text,
            }}
          />
          <Button
            title={isLoading ? 'Adding...' : 'Add Reminder'}
            onPress={handleAdd}
            isLoading={isLoading}
            fullWidth
            style={{ marginBottom: spacing.sm }}
          />
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            fullWidth
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function RemindersScreen() {
  const { fetchPrescriptions, createReminder, deleteReminder, isLoading } =
    useHealth();
  const [reminders, setReminders] = useState([
    {
      id: 1,
      medicineName: 'Aspirin',
      dosage: '500mg',
      frequency: 'Once daily',
      time: '08:00 AM',
      notes: 'Take with water',
      status: 'active',
    },
    {
      id: 2,
      medicineName: 'Vitamin D',
      dosage: '1000 IU',
      frequency: 'Twice daily',
      time: '02:00 PM',
      notes: '',
      status: 'active',
    },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [error, setError] = useState(null);
  const [addingReminder, setAddingReminder] = useState(false);

  useEffect(() => {
    // fetchPrescriptions().catch(() => {});
  }, []);

  const handleAddReminder = async (reminderData) => {
    setAddingReminder(true);
    setError(null);

    try {
      // TODO: Use actual createReminder from context
      // await createReminder(reminderData);

      const newReminder = {
        id: reminders.length + 1,
        ...reminderData,
        status: 'active',
      };
      setReminders([...reminders, newReminder]);
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Failed to add reminder');
    } finally {
      setAddingReminder(false);
    }
  };

  const handleDeleteReminder = async (id) => {
    setError(null);

    try {
      // TODO: Use actual deleteReminder from context
      // await deleteReminder(id);

      setReminders(reminders.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete reminder');
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading reminders..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={[
              typography.h3,
              {
                color: colors.text,
              },
            ]}
          >
            💊 Medicine Reminders
          </Text>
          <Button
            title="+"
            onPress={() => setShowAddModal(true)}
            size="sm"
          />
        </View>
        {error && (
          <Alert
            type="error"
            message={error}
            onDismiss={() => setError(null)}
            dismissAfter={5000}
          />
        )}
        {reminders.length > 0 ? (
          <>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  marginBottom: spacing.md,
                },
              ]}
            >
              {reminders.length} active reminder
              {reminders.length !== 1 ? 's' : ''}
            </Text>

            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={setEditingReminder}
                onDelete={handleDeleteReminder}
              />
            ))}
          </>
        ) : (
          <Card variant="outlined" padding="md">
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                },
              ]}
            >
              No reminders yet. Add one to stay on track with your medications.
            </Text>
          </Card>
        )}
      </ScrollView>
      <AddReminderModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddReminder}
        isLoading={addingReminder}
      />
    </View>
  );
}
