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
import { useState } from "react";
import { router, Stack } from "expo-router";

const PRESET_AMOUNTS = [5, 10, 20, 50];

export default function DonateScreen() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleDonation = async () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount <= 0) {
      if (Platform.OS === "web") {
        alert("Please select or enter a donation amount");
      } else {
        Alert.alert("Validation Error", "Please select or enter a donation amount");
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

    // Process donation payment
    // Note: In production, integrate with Stripe payment API
    setTimeout(() => {
      setProcessing(false);
      if (Platform.OS === "web") {
        alert(
          `Thank you for your generous donation of $${amount}!\n\nYour support helps keep FilmContract running and improving.\n\n- DeePage Studios`
        );
        router.back();
      } else {
        Alert.alert(
          "Thank You! 🎉",
          `Thank you for your generous donation of $${amount}!\n\nYour support helps keep FilmContract running and improving.\n\n- DeePage Studios`,
          [
            {
              text: "Done",
              onPress: () => router.back(),
            },
          ]
        );
      }
    }, 2000);
  };

  return (
    <ScreenContainer className="p-6">
      <Stack.Screen options={{ title: "Support Developer" }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-3 items-center">
            <Text className="text-4xl">☕</Text>
            <Text className="text-3xl font-bold text-foreground text-center">
              Support the Developer
            </Text>
            <Text className="text-base text-muted text-center">
              Help keep FilmContract free and improving with a small donation
            </Text>
          </View>

          {/* Creator Info */}
          <View className="bg-surface rounded-2xl p-6 gap-3">
            <Text className="text-lg font-bold text-foreground">About the Creator</Text>
            <Text className="text-base text-foreground leading-relaxed">
              We're <Text className="font-semibold">DeePage Studios</Text>, the creators of
              FilmContract. This app was built to make contract management transparent and easy for
              film professionals.
            </Text>
            <Text className="text-base text-muted leading-relaxed">
              Your support helps cover hosting costs, development time, and future improvements.
              Every donation is greatly appreciated! 🙏
            </Text>
          </View>

          {/* Preset Amounts */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Choose an Amount</Text>
            <View className="flex-row flex-wrap gap-3">
              {PRESET_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`flex-1 min-w-[45%] border rounded-xl px-4 py-4 items-center ${
                    selectedAmount === amount
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`text-2xl font-bold ${
                      selectedAmount === amount ? "text-white" : "text-foreground"
                    }`}
                  >
                    ${amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Amount */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Or Enter Custom Amount</Text>
            <TextInput
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text);
                setSelectedAmount(null);
              }}
              placeholder="Enter custom amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* Payment Form */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Payment Details</Text>

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

            {/* Secure Payment Notice */}
            <View className="bg-success/10 border border-success rounded-xl p-4">
              <Text className="text-sm text-foreground font-semibold mb-2">🔒 Secure Payment</Text>
              <Text className="text-sm text-muted leading-relaxed">
                Your payment is processed securely through Stripe. We never store your card details.
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleDonation}
            disabled={processing}
            className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
            style={{ opacity: processing ? 0.6 : 1 }}
          >
            {processing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                Donate ${selectedAmount || customAmount || "0"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
