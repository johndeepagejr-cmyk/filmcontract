import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";

export default function TermsOfServiceScreen() {
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="active:opacity-70">
              <Text className="text-lg text-primary font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Terms of Service</Text>
            <View className="w-16" />
          </View>

          <View className="gap-4">
            <Text className="text-sm text-muted">
              Last Updated: {new Date().toLocaleDateString()}
            </Text>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">1. Acceptance of Terms</Text>
              <Text className="text-base text-foreground leading-6">
                By accessing or using FilmContract ("the App"), you agree to be bound by these Terms
                of Service. If you do not agree to these terms, you may not use the App.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">2. Proprietary Rights</Text>
              <Text className="text-base text-foreground leading-6">
                FilmContract is proprietary software owned by DeePage Studios. All rights,
                title, and interest in and to the App, including all intellectual property rights,
                are and will remain the exclusive property of the owner.
              </Text>
              <Text className="text-base text-foreground leading-6">
                The App's design, user interface, features, functionality, and underlying
                technology are protected by copyright, trademark, patent, and other intellectual
                property laws. You may not copy, modify, distribute, sell, or lease any part of
                the App without express written permission.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">3. License to Use</Text>
              <Text className="text-base text-foreground leading-6">
                Subject to your compliance with these Terms, we grant you a limited,
                non-exclusive, non-transferable, revocable license to access and use the App for
                your personal or business purposes related to film production contracts.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">4. Prohibited Uses</Text>
              <Text className="text-base text-foreground leading-6">
                You may not:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Reverse engineer, decompile, or disassemble the App{"\n"}
                • Copy, reproduce, or create derivative works of the App{"\n"}
                • Remove or alter any copyright, trademark, or proprietary notices{"\n"}
                • Use the App to develop competing products or services{"\n"}
                • Attempt to gain unauthorized access to the App's systems{"\n"}
                • Use the App for any illegal or unauthorized purpose
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">5. User Content</Text>
              <Text className="text-base text-foreground leading-6">
                You retain ownership of any contracts, documents, or content you create using the
                App. By using the App, you grant us a limited license to store and process your
                content solely for the purpose of providing the service.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">6. Payment Terms</Text>
              <Text className="text-base text-foreground leading-6">
                FilmContract facilitates payments between producers and actors. We use
                third-party payment processors (Stripe) to handle transactions. You agree to
                comply with the payment processor's terms and conditions.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">7. Disclaimer of Warranties</Text>
              <Text className="text-base text-foreground leading-6">
                THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">8. Limitation of Liability</Text>
              <Text className="text-base text-foreground leading-6">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE
                OF THE APP.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">9. Legal Advice Disclaimer</Text>
              <Text className="text-base text-foreground leading-6">
                FilmContract provides tools for creating contracts but does not provide legal
                advice. You should consult with a qualified attorney before entering into any
                legal agreement.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">10. Termination</Text>
              <Text className="text-base text-foreground leading-6">
                We reserve the right to suspend or terminate your access to the App at any time,
                with or without cause, with or without notice.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">11. Changes to Terms</Text>
              <Text className="text-base text-foreground leading-6">
                We reserve the right to modify these Terms at any time. Continued use of the App
                after changes constitutes acceptance of the modified Terms.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">12. Governing Law</Text>
              <Text className="text-base text-foreground leading-6">
                These Terms shall be governed by and construed in accordance with the laws of the
                United States, without regard to conflict of law principles.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">13. Contact Information</Text>
              <Text className="text-base text-foreground leading-6">
                For questions about these Terms, please contact us through the app's support
                channels.
              </Text>
            </View>

            <View className="bg-warning/10 border border-warning rounded-xl p-4 mt-4">
              <Text className="text-base font-bold text-warning mb-2">
                ⚠️ Copyright Notice
              </Text>
              <Text className="text-sm text-foreground leading-6">
                © {new Date().getFullYear()} DeePage Studios. All Rights Reserved.{"\n\n"}
                FilmContract is proprietary software. Unauthorized copying, distribution,
                modification, or use of this software or its design is strictly prohibited and
                may result in legal action.
              </Text>
            </View>
          </View>

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
