/**
 * UploadQueue — Singleton service for managing background file uploads
 * Provides a centralized queue that persists across screen navigation.
 * © John dee page jr
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────
export type QueueItemStatus = "queued" | "uploading" | "paused" | "completed" | "failed";

export interface QueueItem {
  id: string;
  fileUri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  castingId: number;
  submissionId?: number;
  status: QueueItemStatus;
  progress: number;
  uploadedBytes: number;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  completedAt: string | null;
  metadata: Record<string, any>;
}

type QueueListener = (items: QueueItem[]) => void;

const STORAGE_KEY = "@filmcontract:upload_queue";
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Singleton ──────────────────────────────────────────────
class UploadQueueService {
  private items: QueueItem[] = [];
  private listeners: Set<QueueListener> = new Set();
  private isProcessing = false;
  private maxConcurrent = 2;
  private activeUploads = 0;

  constructor() {
    this.loadFromStorage();
  }

  // ─── Persistence ────────────────────────────────────────
  private async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
        // Reset any "uploading" items to "queued" on app restart
        this.items = this.items.map((item) =>
          item.status === "uploading" ? { ...item, status: "queued" as const } : item
        );
        this.notifyListeners();
      }
    } catch {
      // Ignore storage errors
    }
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      // Ignore storage errors
    }
  }

  // ─── Listeners ──────────────────────────────────────────
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.items);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l([...this.items]));
  }

  // ─── Queue Operations ──────────────────────────────────
  addItem(file: {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
    castingId: number;
    metadata?: Record<string, any>;
  }): string {
    const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item: QueueItem = {
      id,
      fileUri: file.uri,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mimeType,
      castingId: file.castingId,
      status: "queued",
      progress: 0,
      uploadedBytes: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      completedAt: null,
      metadata: file.metadata || {},
    };

    this.items.push(item);
    this.notifyListeners();
    this.saveToStorage();
    return id;
  }

  removeItem(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.notifyListeners();
    this.saveToStorage();
  }

  getItem(id: string): QueueItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  getAll(): QueueItem[] {
    return [...this.items];
  }

  getByStatus(status: QueueItemStatus): QueueItem[] {
    return this.items.filter((i) => i.status === status);
  }

  getPending(): QueueItem[] {
    return this.items.filter((i) => i.status === "queued" || i.status === "uploading");
  }

  getCompleted(): QueueItem[] {
    return this.items.filter((i) => i.status === "completed");
  }

  // ─── Upload Control ─────────────────────────────────────
  private updateItem(id: string, updates: Partial<QueueItem>) {
    this.items = this.items.map((i) => (i.id === id ? { ...i, ...updates } : i));
    this.notifyListeners();
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (true) {
      const queued = this.items.filter((i) => i.status === "queued");
      const available = this.maxConcurrent - this.activeUploads;

      if (queued.length === 0 || available <= 0) break;

      const batch = queued.slice(0, available);
      await Promise.all(batch.map((item) => this.uploadItem(item.id)));
    }

    this.isProcessing = false;
  }

  private async uploadItem(id: string) {
    const item = this.getItem(id);
    if (!item) return;

    this.activeUploads++;
    this.updateItem(id, { status: "uploading" });

    try {
      // Simulate chunked upload
      const totalChunks = Math.ceil(item.fileSize / CHUNK_SIZE);
      const startChunk = Math.floor(item.uploadedBytes / CHUNK_SIZE);

      for (let i = startChunk; i < totalChunks; i++) {
        const currentItem = this.getItem(id);
        if (!currentItem || currentItem.status === "paused") break;

        // Simulate chunk upload delay
        await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

        const uploaded = Math.min((i + 1) * CHUNK_SIZE, item.fileSize);
        const progress = (uploaded / item.fileSize) * 100;

        this.updateItem(id, {
          uploadedBytes: uploaded,
          progress,
        });
      }

      const finalItem = this.getItem(id);
      if (finalItem && finalItem.status === "uploading") {
        this.updateItem(id, {
          status: "completed",
          progress: 100,
          uploadedBytes: item.fileSize,
          completedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      const currentItem = this.getItem(id);
      if (currentItem && currentItem.retryCount < currentItem.maxRetries) {
        this.updateItem(id, {
          status: "queued",
          retryCount: currentItem.retryCount + 1,
        });
        // Exponential backoff
        const delay = Math.pow(2, currentItem.retryCount) * 1000;
        setTimeout(() => this.processQueue(), delay);
      } else {
        this.updateItem(id, {
          status: "failed",
        });
      }
    } finally {
      this.activeUploads--;
      this.saveToStorage();
    }
  }

  pauseItem(id: string) {
    this.updateItem(id, { status: "paused" });
    this.saveToStorage();
  }

  resumeItem(id: string) {
    this.updateItem(id, { status: "queued" });
    this.processQueue();
    this.saveToStorage();
  }

  retryItem(id: string) {
    const item = this.getItem(id);
    if (item) {
      this.updateItem(id, { status: "queued", retryCount: 0 });
      this.processQueue();
    }
  }

  pauseAll() {
    this.items
      .filter((i) => i.status === "uploading")
      .forEach((i) => this.pauseItem(i.id));
  }

  resumeAll() {
    this.items
      .filter((i) => i.status === "paused")
      .forEach((i) => this.updateItem(i.id, { status: "queued" }));
    this.processQueue();
  }

  clearCompleted() {
    this.items = this.items.filter((i) => i.status !== "completed");
    this.notifyListeners();
    this.saveToStorage();
  }

  clearAll() {
    this.items = [];
    this.notifyListeners();
    this.saveToStorage();
  }

  // ─── Stats ──────────────────────────────────────────────
  getStats() {
    return {
      total: this.items.length,
      queued: this.items.filter((i) => i.status === "queued").length,
      uploading: this.items.filter((i) => i.status === "uploading").length,
      paused: this.items.filter((i) => i.status === "paused").length,
      completed: this.items.filter((i) => i.status === "completed").length,
      failed: this.items.filter((i) => i.status === "failed").length,
      totalBytes: this.items.reduce((sum, i) => sum + i.fileSize, 0),
      uploadedBytes: this.items.reduce((sum, i) => sum + i.uploadedBytes, 0),
      overallProgress: this.items.length > 0
        ? this.items.reduce((sum, i) => sum + i.progress, 0) / this.items.length
        : 0,
    };
  }
}

// Export singleton instance
export const uploadQueue = new UploadQueueService();
