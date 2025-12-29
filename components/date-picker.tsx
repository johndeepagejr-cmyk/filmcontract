import { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export function DatePicker({ label, value, onChange, placeholder = "Select date" }: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      // Format as YYYY-MM-DD
      const formatted = selectedDate.toISOString().split("T")[0];
      onChange(formatted);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (Platform.OS === "web") {
    // Use native HTML5 date input for web
    return (
      <View>
        <Text className="text-sm font-semibold text-foreground mb-2">{label}</Text>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
          style={{
            fontSize: "16px",
            fontFamily: "system-ui",
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <Text className="text-sm font-semibold text-foreground mb-2">{label}</Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className="bg-surface border border-border rounded-xl px-4 py-3"
      >
        <Text className={value ? "text-foreground" : "text-muted"}>
          {formatDisplayDate(value)}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          onTouchCancel={() => setShow(false)}
        />
      )}
    </View>
  );
}
