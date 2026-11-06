export type VaultStore = "music" | "media" | "letters";
function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("Local storage is unavailable in this browser."));
      return;
    }
    const request = indexedDB.open("starwoven-vault", 1);
    request.onupgradeneeded = () => {
      for (const name of ["music", "media", "letters"])
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name, { keyPath: "id" });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () =>
      reject(
        request.error || new Error("Your local collection could not open."),
      );
  });
}
export async function vaultAll<T>(store: VaultStore): Promise<T[]> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly"),
      request = tx.objectStore(store).getAll();
    tx.oncomplete = () => {
      db.close();
      resolve(request.result as T[]);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function vaultGet<T>(
  store: VaultStore,
  id: string,
): Promise<T | undefined> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly"),
      request = tx.objectStore(store).get(id);
    tx.oncomplete = () => {
      db.close();
      resolve(request.result as T | undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function vaultPut<T extends { id: string }>(
  store: VaultStore,
  value: T,
): Promise<void> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Your device could not save this item."));
    };
  });
}
export async function vaultDelete(
  store: VaultStore,
  id: string,
): Promise<void> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export type LocalMedia = { id: string; blob: Blob; createdAt: string };
