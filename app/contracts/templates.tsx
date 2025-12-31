import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function TemplateSelectionScreen() {
  const { data: templates, isLoading } = trpc.templates.list.useQuery();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplate(templateId);
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      // Navigate to create contract with template data
      router.push({
        pathname: "/(tabs)/create",
        params: {
          templateId: template.id.toString(),
          paymentTerms: template.defaultPaymentTerms || "",
          deliverables: template.defaultDeliverables || "",
        },
      });
    }
  };

  const handleSkipTemplate = () => {
    router.push("/(tabs)/create");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Choose a Template</Text>
            <Text className="text-base text-muted">
              Start with a pre-made template or create from scratch
            </Text>
          </View>

          {/* Skip Button */}
          <TouchableOpacity
            onPress={handleSkipTemplate}
            className="bg-surface border border-border rounded-xl p-4 active:opacity-70"
          >
            <Text className="text-base font-semibold text-foreground">
              ✏️ Start from Scratch
            </Text>
            <Text className="text-sm text-muted mt-1">
              Create a custom contract without a template
            </Text>
          </TouchableOpacity>

          {/* Templates List */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">Pre-Made Templates</Text>
            {templates && templates.length > 0 ? (
              <View className="gap-3">
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleSelectTemplate(template.id)}
                    className="bg-surface border border-border rounded-xl p-4 gap-2 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-semibold text-foreground">
                        {template.name}
                      </Text>
                      {template.isSystemTemplate && (
                        <View className="bg-primary px-2 py-1 rounded-full">
                          <Text className="text-xs font-bold text-white">OFFICIAL</Text>
                        </View>
                      )}
                    </View>
                    {template.description && (
                      <Text className="text-sm text-muted">{template.description}</Text>
                    )}
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className="bg-primary/10 px-2 py-1 rounded-full">
                        <Text className="text-xs font-semibold text-primary">
                          {template.category.replace("_", " ").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {template.defaultPaymentTerms && (
                      <View className="mt-2 pt-2 border-t border-border">
                        <Text className="text-xs font-semibold text-muted">Payment Terms:</Text>
                        <Text className="text-sm text-foreground mt-1">
                          {template.defaultPaymentTerms.substring(0, 100)}
                          {template.defaultPaymentTerms.length > 100 && "..."}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-xl p-6 items-center">
                <Text className="text-muted text-center">No templates available</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
