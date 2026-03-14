const sessionStorage = {
    save(key: string, value: string) {
        window.sessionStorage.setItem(key, value)
    },
    load(key: string) {
        return window.sessionStorage.getItem(key)
    },
    clear() {
        window.sessionStorage.clear()
    },
    isEmpty() {
        return window.sessionStorage.length === 0
    },
    loadAll() {
        const archive: Record<string, string | null> = {}
        const keys = Object.keys(window.sessionStorage)
        let index = keys.length

        while(index--) {
            archive[keys.at(index)!] = window.sessionStorage.getItem(keys.at(index)!)
        }

        return archive
    }
}

const indexedDBStorage = {
    db: null as IDBDatabase | null,

    async initDB() {
        return new Promise<void>((resolve, reject) => {
            const request = window.indexedDB.open('studentDB', 1)

            request.onerror = (event) => {
                console.error("IndexedDB error:", event)
                reject("Failed to open the database")
            }

            request.onsuccess = (event) => {
                indexedDBStorage.db = (event.target as IDBOpenDBRequest).result
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                db.createObjectStore('data')
            }
        })
    },

    async save(key: string | number, value: unknown) {
        if(!indexedDBStorage.db)
            await indexedDBStorage.initDB()

        const transaction = indexedDBStorage.db!.transaction('data', 'readwrite')
        const objectStore = transaction.objectStore('data')
        objectStore.put(value, key)
    },

    async load(key: string | number) {
        if(!indexedDBStorage.db)
            await indexedDBStorage.initDB()

        const transaction = indexedDBStorage.db!.transaction('data', 'readonly')
        const objectStore = transaction.objectStore('data')
        const request = objectStore.get(key)

        return new Promise<string | undefined>((resolve, reject) => {
            request.onsuccess = (event) => {
                const data = (event.target as IDBRequest).result
                resolve(data ? data.value : undefined)
            }

            request.onerror = (event) => {
                console.error("Error loading data from IndexedDB:", event)
                reject("Failed to load data from IndexedDB")
            }
        })
    },

    async clear() {
        if(!indexedDBStorage.db)
            await indexedDBStorage.initDB()

        const transaction = indexedDBStorage.db!.transaction('data', 'readwrite')
        const objectStore = transaction.objectStore('data')
        objectStore.clear()
    },

    async isEmpty() {
        const data = await indexedDBStorage.loadAll()
        return Object.keys(data).length === 0
    },

    async loadAll() {
        if(!indexedDBStorage.db)
            await indexedDBStorage.initDB()

        const transaction = indexedDBStorage.db!.transaction('data', 'readonly')
        const objectStore = transaction.objectStore('data')
        const request = objectStore.getAll()

        return new Promise<{ [key: string]: string }>((resolve, reject) => {
            request.onsuccess = (event) => {
                const data = (event.target as IDBRequest).result
                const archive: { [key: string]: string } = {}
                for(const item of data) {
                    archive[item.key] = item.value
                }
                resolve(archive)
            }

            request.onerror = (event) => {
                console.error("Error loading all data from IndexedDB:", event)
                reject("Failed to load all data from IndexedDB")
            }
        })
    }
}

export { sessionStorage, indexedDBStorage }
