export interface OfflineCheckIn {
  id?: number;
  fullName: string;
  phone: string;
  cattleCount: number;
  pricePerCattle: number;
  parkingType: "DAY" | "NIGHT";
  amountPaid: number;
  paymentMethod: string;
  timestamp: number;
  token: string;
}

const DB_NAME = "CattleHavenOfflineDB";
const STORE_NAME = "offline_checkins";
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      console.error("IndexedDB failed to open:", request.error);
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

export async function saveOfflineCheckIn(checkIn: OfflineCheckIn): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(checkIn);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error saving offline checkin:", err);
    throw err;
  }
}

export async function getOfflineCheckIns(): Promise<OfflineCheckIn[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error getting offline checkins:", err);
    return [];
  }
}

export async function deleteOfflineCheckIn(id: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error deleting offline checkin:", err);
    throw err;
  }
}
