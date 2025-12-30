import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";

export default function PrivacyPolicyScreen() {
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="active:opacity-70">
              <Text className="text-lg text-primary font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Privacy Policy</Text>
            <View className="w-16" />
          </View>

          <View className="gap-4">
            <Text className="text-sm text-muted">
              Last Updated: {new Date().toLocaleDateString()}
            </Text>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">1. Introduction</Text>
              <Text className="text-base text-foreground leading-6">
                FilmContract ("we," "our," or "us") respects your privacy and is committed to
                protecting your personal information. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our mobile application.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">2. Information We Collect</Text>
              <Text className="text-base text-foreground leading-6 font-semibold">
                Account Information:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Name and email address (via OAuth authentication){"\n"}
                • User role (producer or actor){"\n"}
                • Profile information (bio, location, experience, specialties){"\n"}
                • Profile photos and portfolio images
              </Text>
              <Text className="text-base text-foreground leading-6 font-semibold mt-2">
                Contract Information:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Contract details (project titles, payment terms, dates){"\n"}
                • Digital signatures{"\n"}
                • Contract history and modifications
              </Text>
              <Text className="text-base text-foreground leading-6 font-semibold mt-2">
                Payment Information:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Payment transaction data (processed by Stripe){"\n"}
                • We do not store full credit card numbers
              </Text>
              <Text className="text-base text-foreground leading-6 font-semibold mt-2">
                Usage Information:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Device information and operating system{"\n"}
                • App usage patterns and features accessed{"\n"}
                • Error logs and diagnostic data
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">3. How We Use Your Information</Text>
              <Text className="text-base text-foreground leading-6">
                We use your information to:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Provide and maintain the FilmContract service{"\n"}
                • Create and manage your account{"\n"}
                • Process contracts and payments{"\n"}
                • Send notifications about contract status changes{"\n"}
                • Improve and optimize the App{"\n"}
                • Provide customer support{"\n"}
                • Detect and prevent fraud or abuse{"\n"}
                • Comply with legal obligations
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">4. Information Sharing</Text>
              <Text className="text-base text-foreground leading-6">
                We do not sell your personal information. We may share your information with:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Other users: Your profile information and contract details are shared with
                parties to your contracts (producers and actors){"\n\n"}
                • Service providers: We use third-party services including Manus (authentication),
                Stripe (payments), and AWS (hosting){"\n\n"}
                • Legal requirements: We may disclose information if required by law or to protect
                our rights
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">5. Data Security</Text>
              <Text className="text-base text-foreground leading-6">
                We implement industry-standard security measures to protect your information,
                including:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Encrypted data transmission (HTTPS/TLS){"\n"}
                • Secure authentication via OAuth{"\n"}
                • Regular security audits{"\n"}
                • Access controls and monitoring
              </Text>
              <Text className="text-base text-foreground leading-6 mt-2">
                However, no method of transmission over the internet is 100% secure. We cannot
                guarantee absolute security of your information.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">6. Data Retention</Text>
              <Text className="text-base text-foreground leading-6">
                We retain your information for as long as your account is active or as needed to
                provide services. Contract data may be retained for legal and compliance purposes
                even after account deletion.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">7. Your Rights</Text>
              <Text className="text-base text-foreground leading-6">
                You have the right to:
              </Text>
              <Text className="text-base text-foreground leading-6 ml-4">
                • Access your personal information{"\n"}
                • Correct inaccurate information{"\n"}
                • Request deletion of your account and data{"\n"}
                • Export your contract data{"\n"}
                • Opt out of marketing communications{"\n"}
                • Withdraw consent for data processing
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">8. Children's Privacy</Text>
              <Text className="text-base text-foreground leading-6">
                FilmContract is not intended for users under 18 years of age. We do not knowingly
                collect information from children. If you believe we have collected information
                from a child, please contact us immediately.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">9. International Users</Text>
              <Text className="text-base text-foreground leading-6">
                Your information may be transferred to and processed in the United States or other
                countries where our service providers operate. By using the App, you consent to
                such transfers.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">10. Changes to Privacy Policy</Text>
              <Text className="text-base text-foreground leading-6">
                We may update this Privacy Policy from time to time. We will notify you of
                significant changes by posting a notice in the App or sending an email.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">11. Contact Us</Text>
              <Text className="text-base text-foreground leading-6">
                If you have questions about this Privacy Policy or how we handle your information,
                please contact us through the app's support channels.
              </Text>
            </View>

            <View className="bg-primary/10 border border-primary rounded-xl p-4 mt-4">
              <Text className="text-base font-bold text-primary mb-2">
                🔒 Your Privacy Matters
              </Text>
              <Text className="text-sm text-foreground leading-6">
                We are committed to protecting your privacy and handling your data responsibly.
                Your trust is important to us, and we work hard to earn and maintain it.
              </Text>
            </View>

            <View className="bg-surface border border-border rounded-xl p-4 mt-2">
              <Text className="text-xs text-muted leading-5">
                © {new Date().getFullYear()} John Dee Page Jr. All Rights Reserved.{"\n"}
                FilmContract is proprietary software protected by copyright and other intellectual
                property laws.
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
