/**
 * Doctor Find Screen
 * Search and filter doctors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { apiClient } from '../../api/client';
import { Button, Card, Avatar, Badge, Loading } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';

const DoctorCard = ({ doctor, onSelect }) => (
  <Pressable onPress={() => onSelect(doctor)}>
    <Card variant="elevated" padding="md" style={{ marginBottom: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          marginBottom: spacing.md,
        }}
      >
        <Avatar
          name={doctor.name}
          size="lg"
          style={{ marginRight: spacing.md }}
        />
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
            Dr. {doctor.name}
          </Text>
          <Text
            style={[
              typography.caption,
              {
                color: colors.textSecondary,
                marginBottom: spacing.xs,
              },
            ]}
          >
            {doctor.specialty}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              ⭐ {doctor.rating}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              ({doctor.reviews} reviews)
            </Text>
          </View>
        </View>
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
          📍 {doctor.location}
        </Text>
      </View>

      <Button
        title="Book Appointment"
        onPress={() => onSelect(doctor)}
        size="sm"
        fullWidth
      />
    </Card>
  </Pressable>
);

export default function DoctorFindScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const SPECIALTIES = [
    'General',
    'Cardiologist',
    'Dermatologist',
    'Pediatrician',
    'Orthopedic',
    'Psychiatrist',
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const mockDoctors = [
        {
          id: 1,
          name: 'Rajesh Kumar',
          specialty: 'General Physician',
          rating: 4.8,
          reviews: 234,
          location: 'Delhi',
          experience: '15 years',
          fee: 500,
        },
        {
          id: 2,
          name: 'Priya Sharma',
          specialty: 'Cardiologist',
          rating: 4.9,
          reviews: 189,
          location: 'Mumbai',
          experience: '12 years',
          fee: 800,
        },
        {
          id: 3,
          name: 'Amit Patel',
          specialty: 'Dermatologist',
          rating: 4.7,
          reviews: 156,
          location: 'Bangalore',
          experience: '10 years',
          fee: 600,
        },
      ];
      setDoctors(mockDoctors);
      setFilteredDoctors(mockDoctors);
    } catch (err) {
      setError('Failed to fetch doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    filterDoctors(text, selectedSpecialty);
  };

  const handleSpecialtyFilter = (specialty) => {
    const newSpecialty = selectedSpecialty === specialty ? null : specialty;
    setSelectedSpecialty(newSpecialty);
    filterDoctors(searchText, newSpecialty);
  };

  const filterDoctors = (search, specialty) => {
    let filtered = doctors;

    if (search) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(search.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (specialty) {
      filtered = filtered.filter((doctor) =>
        doctor.specialty.includes(specialty)
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleSelectDoctor = (doctor) => {
    navigation.navigate('AppointmentBooking', { doctor });
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading doctors..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text
          style={[
            typography.h3,
            {
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
        >
          👨‍⚕️ Find a Doctor
        </Text>
        <TextInput
          value={searchText}
          onChangeText={handleSearch}
          placeholder="Search by name or specialty..."
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
            typography.h4,
            {
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
        >
          Filter by Specialty
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.lg }}
        >
          {SPECIALTIES.map((specialty) => (
            <Pressable
              key={specialty}
              onPress={() => handleSpecialtyFilter(specialty)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 20,
                backgroundColor:
                  selectedSpecialty === specialty
                    ? colors.secondary
                    : colors.white,
                borderWidth: 1,
                borderColor:
                  selectedSpecialty === specialty
                    ? colors.secondary
                    : colors.border,
                marginRight: spacing.sm,
              }}
            >
              <Text
                style={{
                  color:
                    selectedSpecialty === specialty
                      ? colors.white
                      : colors.text,
                  fontWeight: '500',
                  fontSize: 14,
                }}
              >
                {specialty}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {filteredDoctors.length > 0 ? (
          <>
            <Text
              style={[
                typography.h4,
                {
                  color: colors.text,
                  marginBottom: spacing.md,
                },
              ]}
            >
              {filteredDoctors.length} Doctor
              {filteredDoctors.length !== 1 ? 's' : ''} Found
            </Text>

            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onSelect={handleSelectDoctor}
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
              No doctors found matching your search.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
