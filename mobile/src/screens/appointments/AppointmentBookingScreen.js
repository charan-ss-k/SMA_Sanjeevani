/**
 * Appointment Booking Screen
 * Schedule appointment with selected doctor
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { useHealth } from '../../context/HealthContext';
import { Button, Card, Alert, Loading } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';

const TimeSlotGrid = ({ slots, selectedSlot, onSelectSlot }) => (
  <View
    style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.md,
    }}
  >
    {slots.map((slot) => (
      <Pressable
        key={slot}
        onPress={() => onSelectSlot(slot)}
        style={{
          flex: 1,
          minWidth: '30%',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
          borderRadius: 8,
          backgroundColor:
            selectedSlot === slot ? colors.secondary : colors.white,
          borderWidth: 1,
          borderColor:
            selectedSlot === slot ? colors.secondary : colors.border,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: selectedSlot === slot ? colors.white : colors.text,
            fontWeight: '600',
            fontSize: 14,
          }}
        >
          {slot}
        </Text>
      </Pressable>
    ))}
  </View>
);

export default function AppointmentBookingScreen({ route, navigation }) {
  const { doctor } = route.params || {};
  const { createAppointment, isLoading } = useHealth();

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [consultationType, setConsultationType] = useState('video'); // video or clinic
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const TIME_SLOTS = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
  ];

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      const appointmentData = {
        doctorId: doctor?.id,
        doctorName: doctor?.name,
        date: selectedDate,
        time: selectedTime,
        type: consultationType,
        notes,
      };

      // TODO: Use actual createAppointment from context
      // await createAppointment(appointmentData);

      setSuccess(true);
      setTimeout(() => {
        navigation.navigate('Appointments');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  if (!doctor) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[typography.body, { color: colors.text }]}>
          No doctor selected
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.lg,
      }}
    >
      <Text
        style={[
          typography.h3,
          {
            color: colors.text,
            marginBottom: spacing.lg,
          },
        ]}
      >
        📅 Book Appointment
      </Text>
      <Card variant="elevated" padding="md" style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            typography.h4,
            {
              color: colors.text,
              marginBottom: spacing.sm,
            },
          ]}
        >
          Dr. {doctor.name}
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
          {doctor.specialty}
        </Text>
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          ⭐ {doctor.rating} • Consultation Fee: ₹{doctor.fee}
        </Text>
      </Card>
      <Text
        style={[
          typography.h4,
          {
            color: colors.text,
            marginBottom: spacing.md,
          },
        ]}
      >
        Consultation Type
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        {['video', 'clinic'].map((type) => (
          <Pressable
            key={type}
            onPress={() => setConsultationType(type)}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: 8,
              backgroundColor:
                consultationType === type ? colors.secondary : colors.white,
              borderWidth: 1,
              borderColor:
                consultationType === type ? colors.secondary : colors.border,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color:
                  consultationType === type ? colors.white : colors.text,
                fontWeight: '600',
                fontSize: 14,
                textTransform: 'capitalize',
              }}
            >
              {type === 'video' ? '📹 Video' : '🏥 Clinic'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text
        style={[
          typography.h4,
          {
            color: colors.text,
            marginBottom: spacing.md,
          },
        ]}
      >
        Select Date
      </Text>

      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          marginBottom: spacing.lg,
          backgroundColor: selectedDate ? colors.gray[50] : colors.white,
        }}
      >
        <Text
          style={{
            color: selectedDate ? colors.text : colors.textLight,
            fontSize: 16,
          }}
        >
          {selectedDate || 'Choose a date...'}
        </Text>
      </Pressable>
      <Text
        style={[
          typography.h4,
          {
            color: colors.text,
            marginBottom: spacing.md,
          },
        ]}
      >
        Select Time
      </Text>

      <TimeSlotGrid
        slots={TIME_SLOTS}
        selectedSlot={selectedTime}
        onSelectSlot={setSelectedTime}
      />
      <Text
        style={[
          typography.h4,
          {
            color: colors.text,
            marginTop: spacing.lg,
            marginBottom: spacing.md,
          },
        ]}
      >
        Additional Notes
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: spacing.md,
          marginBottom: spacing.lg,
          minHeight: 100,
        }}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            fontStyle: 'italic',
          }}
        >
          Add any additional information for the doctor...
        </Text>
      </View>
      {error && (
        <Alert
          type="error"
          message={error}
          onDismiss={() => setError(null)}
          dismissAfter={5000}
        />
      )}
      {success && (
        <Alert
          type="success"
          message="Appointment booked successfully!"
          dismissAfter={2000}
        />
      )}
      <Button
        title={isBooking ? 'Booking...' : 'Confirm Booking'}
        onPress={handleBookAppointment}
        isLoading={isBooking}
        fullWidth
        style={{ marginBottom: spacing.lg }}
      />
      <Card variant="outlined" padding="md">
        <Text
          style={[
            typography.labelSmall,
            {
              color: colors.textSecondary,
              marginBottom: spacing.sm,
            },
          ]}
        >
          BOOKING SUMMARY
        </Text>
        <View style={{ gap: spacing.sm }}>
          {[
            { label: 'Doctor', value: `Dr. ${doctor.name}` },
            { label: 'Type', value: consultationType },
            {
              label: 'Date & Time',
              value: selectedDate && selectedTime 
                ? `${selectedDate}, ${selectedTime}` 
                : 'Not selected',
            },
            { label: 'Fee', value: `₹${doctor.fee}` },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
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
                {item.label}:
              </Text>
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.text,
                    fontWeight: '600',
                  },
                ]}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}
