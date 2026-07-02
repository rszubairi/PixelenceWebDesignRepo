import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useState, useEffect } from 'react';
import { api } from '@pixelence/convex';

export default function AppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState(undefined);

  useEffect(() => {
    api.appointments.getAllAppointments()
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]));
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('AppointmentDetail', { id: item._id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.patientId}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'scheduled' ? '#D1FAE5' : '#FEF3C7' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'scheduled' ? '#059669' : '#D97706' }
          ]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🕒 {item.appointmentTime}</Text>
          <Text style={styles.infoLabel}>📅 {item.appointmentDate}</Text>
        </View>
        <Text style={styles.typeText}>{item.type}</Text>
      </View>
      <TouchableOpacity 
        style={styles.viewButton}
        onPress={() => navigation.navigate('AppointmentDetail', { id: item._id })}
      >
        <Text style={styles.viewButtonText}>View Details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (appointments === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Appointments</Text>
      </View>
      
      <FlatList
        data={appointments}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming appointments found.</Text>
          </View>
        }
      />
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
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  typeText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
  }
});
