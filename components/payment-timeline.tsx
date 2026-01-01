import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

interface PaymentTimelineProps {
  contractId: number;
  totalAmount: number;
}

export function PaymentTimeline({ contractId, totalAmount }: PaymentTimelineProps) {
  const colors = useColors();
  const [showRecordModal, setShowRecordModal] = useState(false);
  
  const { data: payments, isLoading } = trpc.payments.getHistory.useQuery({ contractId });
  
  const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const progress = (totalPaid / totalAmount) * 100;
  
  if (isLoading) {
    return (
      <View className="p-4">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  
  return (
    <View className="p-4">
      <View className="mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-base font-semibold text-foreground">Payment Progress</Text>
          <Text className="text-base font-semibold text-foreground">
            ${totalPaid.toLocaleString()} / ${totalAmount.toLocaleString()}
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View className="h-3 bg-surface rounded-full overflow-hidden">
          <View 
            className="h-full bg-primary" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
        
        <Text className="text-sm text-muted mt-1">
          {progress.toFixed(1)}% paid
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-foreground">Payment History</Text>
        <TouchableOpacity
          className="bg-primary px-4 py-2 rounded-lg"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowRecordModal(true);
          }}
        >
          <Text className="text-background font-semibold">Record Payment</Text>
        </TouchableOpacity>
      </View>
      
      {payments && payments.length > 0 ? (
        <ScrollView className="max-h-80">
          {payments.map((payment, index) => (
            <View 
              key={payment.id} 
              className="mb-3 p-3 bg-surface rounded-lg border border-border"
            >
              <View className="flex-row justify-between mb-1">
                <Text className="text-base font-semibold text-foreground">
                  ${parseFloat(payment.amount).toLocaleString()}
                </Text>
                <Text className="text-sm text-muted">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </Text>
              </View>
              
              {payment.notes && (
                <Text className="text-sm text-muted mt-1">{payment.notes}</Text>
              )}
              
              {payment.receiptUrl && (
                <TouchableOpacity className="mt-2">
                  <Text className="text-sm text-primary">View Receipt →</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="p-6 bg-surface rounded-lg items-center">
          <Text className="text-muted text-center">
            No payments recorded yet. Tap "Record Payment" to add the first payment.
          </Text>
        </View>
      )}
    </View>
  );
}
