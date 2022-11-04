// process.memoryUsage() can throw on some platforms, see #67
export function safeMemoryUsage() {
  try {
    return process.memoryUsage();
  } catch {
    return;
  }
}
