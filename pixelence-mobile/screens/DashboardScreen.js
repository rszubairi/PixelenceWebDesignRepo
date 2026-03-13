import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';

import { useQuery, useAction } from 'convex/react';
import { api } from '@pixelence/convex';

export default function DashboardScreen({ user, onLogout, navigation }) {
  const appointments = useQuery(api.appointments.getAllAppointments) || [];
  const recentJobs = useQuery(api.jobs.getRecentJobs, { limit: 5 }) || [];

  const upcomingCount = appointments.filter(a => a.status === 'scheduled').length;
  const reportCount = recentJobs.filter(j => j.status === 'completed').length;
  
  const stats = [
    { label: 'Upcoming', value: upcomingCount.toString(), color: '#8B5CF6', screen: 'Appointments' },
    { label: 'Completed', value: reportCount.toString(), color: '#10B981', screen: 'Reports' },
    { label: 'Active', value: recentJobs.length.toString(), color: '#3182CE', screen: 'Reports' },
  ];

  const recentActivities = recentJobs.map(job => ({
    id: job._id,
    title: `${job.studyType} - ${job.patientId}`,
    time: new Date(job.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: job.status,
    screen: 'DicomViewer',
    params: { jobId: job.jobId }
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.statCard}
              onPress={() => navigation.navigate(stat.screen)}
            >
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGridContainer}>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Appointments')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Text style={{ fontSize: 20 }}>📅</Text>
              </View>
              <Text style={styles.actionLabel}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Reports')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                <Text style={{ fontSize: 20 }}>📄</Text>
              </View>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Text style={{ fontSize: 20 }}>💬</Text>
              </View>
              <Text style={styles.actionLabel}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {recentActivities.map((activity) => (
            <TouchableOpacity 
              key={activity.id} 
              style={styles.activityItem}
              onPress={() => navigation.navigate(activity.screen, activity.params)}
            >
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: activity.status === 'New' ? '#DBEAFE' : '#F1F5F9' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: activity.status === 'New' ? '#2563EB' : '#475569' }
                ]}>{activity.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Call to Action */}
        <TouchableOpacity style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Need Assistance?</Text>
          <Text style={styles.ctaSubtitle}>Contact our 24/7 support team for any medical inquiries.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  activityContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  activityTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ctaCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
  },
  ctaSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  }
});
