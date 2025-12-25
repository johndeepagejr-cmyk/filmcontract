import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";

export default function PayContractScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = parseInt(id || "0", 10);
  const { user } = useAuth();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: contract, isLoading: contractLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: !!contractId }
  );

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      if (Platform.OS === "web") {
        alert("Please enter a valid payment amount");
      } else {
        Alert.alert("Validation Error", "Please enter a valid payment amount");
      }
      return;
    }

    if (!cardNumber || !expiryDate || !cvv) {
      if (Platform.OS === "web") {
        alert("Please fill in all payment details");
      } else {
        Alert.alert("Validation Error", "Please fill in all payment details");
      }
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    // In production, this would integrate with Stripe API
    setTimeout(() => {
      setProcessing(false);
      if (Platform.OS === "web") {
        alert(
          `Payment of $${paymentAmount} processed successfully!\n\nNote: This is a demo. To enable real payments, you need to:\n1. Create a Stripe account\n2. Get your Stripe API keys\n3. Add them to the app settings`
        );
      } else {
        Alert.alert(
          "Payment Successful",
          `Payment of $${paymentAmount} processed successfully!\n\nNote: This is a demo. To enable real payments, you need to:\n1. Create a Stripe account\n2. Get your Stripe API keys\n3. Add them to the app settings`,
          [
            {
              text: "Learn More",
              onPress: () => Linking.openURL("https://stripe.com/docs"),
            },
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
      if (Platform.OS === "web") {
        router.back();
      }
    }, 2000);
  };

  if (contractLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Pay Contract" }} />
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  if (!contract) {
    return (
      <ScreenContainer className="p-6">
        <Stack.Screen options={{ title: "Contract Not Found" }} />
        <Text className="text-lg text-muted text-center">Contract not found</Text>
      </ScreenContainer>
    );
  }

  // Only allow actor to pay
  if (contract.actorId !== user?.id) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Stack.Screen options={{ title: "Pay Contract" }} />
        <Text className="text-lg text-muted text-center">
          Only the actor can pay this contract
        </Text>
      </ScreenContainer>
    );
  }

  const totalAmount = contract.paymentAmount ? parseFloat(contract.paymentAmount.toString()) : 0;
  const paidAmount = contract.paidAmount ? parseFloat(contract.paidAmount.toString()) : 0;
  const remainingAmount = totalAmount - paidAmount;

  return (
    <ScreenContainer className="p-6">
      <Stack.Screen options={{ title: "Pay Contract" }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Pay Contract</Text>
            <Text className="text-base text-muted">{contract.projectTitle}</Text>
          </View>

          {/* Payment Summary */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Payment Summary</Text>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Total Amount</Text>
              <Text className="text-lg font-semibold text-foreground">
                ${totalAmount.toLocaleString()}
              </Text>
            </View>

            <View className="h-px bg-border" />

            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Paid Amount</Text>
              <Text className="text-lg font-semibold text-success">
                ${paidAmount.toLocaleString()}
              </Text>
            </View>

            <View className="h-px bg-border" />

            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Remaining</Text>
              <Text className="text-xl font-bold text-primary">
                ${remainingAmount.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Payment Form */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Payment Details</Text>

            {/* Payment Amount */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Payment Amount *</Text>
              <TextInput
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder={`Enter amount (max $${remainingAmount.toLocaleString()})`}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* Card Number */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Card Number *</Text>
              <TextInput
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={19}
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* Expiry and CVV */}
            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="text-sm font-medium text-foreground">Expiry Date *</Text>
                <TextInput
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="MM/YY"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={5}
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>

              <View className="flex-1 gap-2">
                <Text className="text-sm font-medium text-foreground">CVV *</Text>
                <TextInput
                  value={cvv}
                  onChangeText={setCvv}
                  placeholder="123"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>
            </View>

            {/* Demo Notice */}
            <View className="bg-warning/10 border border-warning rounded-xl p-4">
              <Text className="text-sm text-foreground font-semibold mb-2">⚠️ Demo Mode</Text>
              <Text className="text-sm text-muted leading-relaxed">
                This is a demonstration. No real payment will be processed. To enable real payments,
                integrate Stripe with your API keys.
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handlePayment}
            disabled={processing}
            className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
            style={{ opacity: processing ? 0.6 : 1 }}
          >
            {processing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Process Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
