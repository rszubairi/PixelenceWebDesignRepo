import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';

import { useQuery } from 'convex/react';
import { api } from '@pixelence/convex';
import { ActivityIndicator } from 'react-native';

export default function ReportsScreen({ navigation }) {
  const reports = useQuery(api.reports.getAllReports);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item.reportId })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.reportType}>{item.reportId}</Text>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'approved' ? '#DBEAFE' : '#F1F5F9' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'approved' ? '#3B82F6' : '#64748B' }
          ]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.patientName}>Patient ID: {item.patientId}</Text>
      <Text style={styles.findingsSnippet} numberOfLines={2}>
        {item.findings}
      </Text>
      <View style={styles.cardFooter}>
         <Text style={styles.viewLink}>View Full Report →</Text>
      </View>
    </TouchableOpacity>
  );

  if (reports === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Medical Reports</Text>
      </View>
      
      <FlatList
        data={reports}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports found.</Text>
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
    color: '#3B82F6',
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
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  findingsSnippet: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 15,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  viewLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  }
});
