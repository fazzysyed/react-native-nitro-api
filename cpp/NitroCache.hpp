#pragma once

#include <chrono>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>

namespace nitro_api {

struct CacheEntry {
  std::string serializedValue;
  uint64_t expiresAtMs;
};

class NitroCache {
 public:
  NitroCache() = default;
  ~NitroCache() = default;

  void set(const std::string& key, const std::string& serializedValue, uint64_t ttlMs);
  std::optional<std::string> get(const std::string& key);
  void remove(const std::string& key);
  void clear();

 private:
  uint64_t nowMs() const;

  std::unordered_map<std::string, CacheEntry> storage_;
  mutable std::mutex mutex_;
};

}  // namespace nitro_api
