import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';

import { useQuery } from 'convex/react';
import { api } from '@pixelence/convex';
import { ActivityIndicator } from 'react-native';

export default function AppointmentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const appointment = useQuery(api.appointments.getAppointmentById, { id });

  if (appointment === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (appointment === null) {
      return (
          <View style={styles.center}>
              <Text>Appointment not found</Text>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Appointment Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.patientName}>Patient: {appointment.patientId}</Text>
          <Text style={styles.typeText}>{appointment.type}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{appointment.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When & Where</Text>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{appointment.appointmentDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{appointment.appointmentTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>Main Imaging Center</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Professional</Text>
          <View style={styles.infoBox}>
            <Text style={styles.doctorName}>Doctor ID: {appointment.doctorId}</Text>
            <Text style={styles.doctorTitle}>Referring Physician</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preparation Instructions</Text>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>{appointment.notes || 'Please arrive 15 minutes before your scheduled appointment.'}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.rescheduleButton}>
            <Text style={styles.rescheduleText}>Request Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 5,
  },
  typeText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 15,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  infoValue: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 14,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  doctorTitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  instructionBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  instructionText: {
    fontSize: 15,
    color: '#92400E',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 15,
    marginTop: 10,
    marginBottom: 30,
  },
  rescheduleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rescheduleText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  cancelText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  }
});
