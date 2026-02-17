/**
 * ErrorBoundary — Global error boundary with network-aware recovery
 *
 * Created by John dee page jr
 */
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError =
        this.state.error?.message?.includes("network") ||
        this.state.error?.message?.includes("Network") ||
        this.state.error?.message?.includes("fetch") ||
        this.state.error?.name === "ApiNetworkError" ||
        this.state.error?.name === "ApiTimeoutError";

      return (
        <View style={styles.container}>
          <Text style={styles.icon}>{isNetworkError ? "📡" : "⚠️"}</Text>
          <Text style={styles.title}>
            {isNetworkError ? "Connection Error" : "Something Went Wrong"}
          </Text>
          <Text style={styles.message}>
            {isNetworkError
              ? "Unable to connect to the server. Please check your internet connection and try again."
              : "An unexpected error occurred. Please try again."}
          </Text>

          <TouchableOpacity onPress={this.handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>

          {__DEV__ && this.state.error && (
            <ScrollView style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>
                {this.state.error.name}: {this.state.error.message}
              </Text>
              {this.state.errorInfo?.componentStack && (
                <Text style={styles.debugText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#ffffff",
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#11181C",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: "#687076",
    textAlign: "center",
    marginBottom: 28,
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 160,
    alignItems: "center",
  },
  retryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  debugContainer: {
    marginTop: 24,
    maxHeight: 200,
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: "#687076",
    fontFamily: "monospace",
  },
});
