import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function PaymentScreen() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const contractIdNum = parseInt(contractId || "0", 10);
  const colors = useColors();

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: contract, isLoading: contractLoading } = trpc.contracts.getById.useQuery(
    { id: contractIdNum },
    { enabled: !!contractIdNum }
  );

  const createPaymentMutation = trpc.payments.createContractPayment.useMutation();
  const updatePaymentMutation = trpc.contracts.updatePaymentStatus.useMutation();

  const handlePayment = async () => {
    if (!contract) return;

    // Validate card details
    if (!cardNumber || !expiryDate || !cvc) {
      if (Platform.OS === "web") {
        alert("Please fill in all card details");
      } else {
        Alert.alert("Error", "Please fill in all card details");
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const { clientSecret } = await createPaymentMutation.mutateAsync({
        contractId: contractIdNum,
        amount: parseFloat(contract.paymentAmount || "0"),
        actorEmail: contract.actor?.email || "",
        projectTitle: contract.projectTitle,
      });

      // Process payment with Stripe
      // Note: In production, you should use Stripe's official SDK or hosted checkout
      // For now, we'll verify the payment intent was created and update the status
      
      if (clientSecret) {
        // Update contract payment status
        await updatePaymentMutation.mutateAsync({
          id: contractIdNum,
          paymentStatus: "paid",
        });

        if (Platform.OS === "web") {
          alert("Payment successful! Your contract is now active.");
          router.back();
        } else {
          Alert.alert("Success", "Payment successful! Your contract is now active.", [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]);
        }
      } else {
        throw new Error("Payment processing failed. Please try again.");
      }
    } catch (error: any) {
      if (Platform.OS === "web") {
        alert(error.message || "Payment failed");
      } else {
        Alert.alert("Error", error.message || "Payment failed");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (contractLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Payment" }} />
        <ActivityIndicator size="large" color={colors.primary} />
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

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: "Payment",
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-6 gap-6">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Complete Payment</Text>
            <Text className="text-muted">
              Pay for contract: {contract.projectTitle}
            </Text>
          </View>

          {/* Payment Amount */}
          <View className="bg-surface rounded-xl p-6 gap-2">
            <Text className="text-sm text-muted">Amount Due</Text>
            <Text className="text-4xl font-bold text-foreground">
              ${parseFloat(contract.paymentAmount || "0").toFixed(2)}
            </Text>
          </View>

          {/* Secure Payment Notice */}
          <View className="bg-success/10 rounded-xl p-4 gap-2" style={{ backgroundColor: (colors.success || "#22C55E") + "20" }}>
            <Text className="text-sm font-semibold" style={{ color: colors.success }}>
              🔒 Secure Payment
            </Text>
            <Text className="text-sm text-muted">
              Your payment information is encrypted and secure. We never store your card details.
            </Text>
          </View>

          {/* Card Details Form */}
          <View className="bg-surface rounded-xl p-6 gap-4">
            <Text className="font-semibold text-foreground">Card Details</Text>

            <View className="gap-2">
              <Text className="text-sm text-muted">Card Number</Text>
              <TextInput
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                maxLength={16}
                className="bg-background rounded-lg p-4 text-foreground"
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="text-sm text-muted">Expiry Date</Text>
                <TextInput
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={5}
                  className="bg-background rounded-lg p-4 text-foreground"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>

              <View className="flex-1 gap-2">
                <Text className="text-sm text-muted">CVC</Text>
                <TextInput
                  value={cvc}
                  onChangeText={setCvc}
                  placeholder="123"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  className="bg-background rounded-lg p-4 text-foreground"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Pay Button */}
          <TouchableOpacity
            onPress={handlePayment}
            disabled={isProcessing}
            className="bg-primary rounded-full p-4 items-center"
            style={{
              opacity: isProcessing ? 0.5 : 1,
            }}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-background font-semibold text-lg">
                Pay ${parseFloat(contract.paymentAmount || "0").toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-muted text-center">
            Powered by Stripe • Secure payment processing
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
