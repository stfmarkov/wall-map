/**
 * Prefix-keyed option cache for filter comboboxes.
 * Fetches at 3+ chars; keeps results while the query still starts with that prefix.
 */
export const useFilterOptionCache = (
  fetchAll: (query: string) => Promise<string[]>,
) => {
  const cachePrefix = ref<string | null>(null)
  const cacheValues = ref<string[]>([])
  const loading = ref(false)
  let requestId = 0

  const matchesQuery = (value: string, query: string) =>
    value.toLowerCase().includes(query.toLowerCase())

  const filtered = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed || !cachePrefix.value) return []
    if (!trimmed.toLowerCase().startsWith(cachePrefix.value.toLowerCase())) {
      return []
    }
    return cacheValues.value.filter((value) => matchesQuery(value, trimmed))
  }

  const sync = async (query: string) => {
    const trimmed = query.trim()

    if (trimmed.length === 0) {
      return []
    }

    if (trimmed.length < 3) {
      return filtered(trimmed)
    }

    const prefix = trimmed.slice(0, 3)
    const prefixValid =
      cachePrefix.value !== null
      && prefix.toLowerCase() === cachePrefix.value.toLowerCase()

    if (prefixValid) {
      return filtered(trimmed)
    }

    const id = ++requestId
    loading.value = true

    try {
      // Fetch for the 3-char prefix so longer queries can filter the full set locally.
      const values = await fetchAll(prefix)
      if (id !== requestId) return filtered(trimmed)

      cachePrefix.value = prefix
      cacheValues.value = values
      return filtered(trimmed)
    }
    finally {
      if (id === requestId) {
        loading.value = false
      }
    }
  }

  const clear = () => {
    requestId += 1
    cachePrefix.value = null
    cacheValues.value = []
    loading.value = false
  }

  return {
    loading,
    sync,
    clear,
  }
}
