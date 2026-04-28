#include "NitroCache.hpp"

namespace nitro_api {

void NitroCache::set(const std::string& key, const std::string& serializedValue, uint64_t ttlMs) {
  std::lock_guard<std::mutex> lock(mutex_);
  const uint64_t expiresAt = ttlMs == 0 ? 0 : nowMs() + ttlMs;
  storage_[key] = CacheEntry{serializedValue, expiresAt};
}

std::optional<std::string> NitroCache::get(const std::string& key) {
  std::lock_guard<std::mutex> lock(mutex_);

  auto iterator = storage_.find(key);
  if (iterator == storage_.end()) {
    return std::nullopt;
  }

  const CacheEntry& entry = iterator->second;
  if (entry.expiresAtMs != 0 && entry.expiresAtMs <= nowMs()) {
    storage_.erase(iterator);
    return std::nullopt;
  }

  return entry.serializedValue;
}

void NitroCache::remove(const std::string& key) {
  std::lock_guard<std::mutex> lock(mutex_);
  storage_.erase(key);
}

void NitroCache::clear() {
  std::lock_guard<std::mutex> lock(mutex_);
  storage_.clear();
}

uint64_t NitroCache::nowMs() const {
  return static_cast<uint64_t>(std::chrono::duration_cast<std::chrono::milliseconds>(
                                   std::chrono::steady_clock::now().time_since_epoch())
                                   .count());
}

}  // namespace nitro_api
