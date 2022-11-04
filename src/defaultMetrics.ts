import { Meter, MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "./config";

// Default metrics.
import { processOpenFileDescriptors } from "./metrics/processOpenFileDescriptors";
import { processMaxFileDescriptors } from "./metrics/processMaxFileDescriptors";
import { reportEventloop } from "./metrics/eventLoopLag";
import { heapSizeAndUsed } from "./metrics/heapSizeAndUsed";
import { osMemoryHeap } from "./metrics/osMemoryHeap";
import { processCpuTotal } from "./metrics/processCpuTotal";
import { processHandles } from "./metrics/processHandles";
import { processResources } from "./metrics/processResources";
import { heapSpacesSizeAndUsed } from "./metrics/heapSpacesSizeAndUsed";
import { processStartTime } from "./metrics/processStartTime";
import { version } from "./metrics/version";
import { gc } from "./metrics/gc";

const metrics = {
  processCpuTotal,
  processStartTime,
  osMemoryHeap,
  processOpenFileDescriptors,
  processMaxFileDescriptors,
  reportEventloop,
  processHandles,
  processResources,
  heapSizeAndUsed,
  heapSpacesSizeAndUsed,
  version,
  gc,
};

function isObject(obj: object) {
  return obj === Object(obj);
}

export function collectDefaultMetrics<Labels extends MetricAttributes>(
  config: Config<Labels>
) {
  if (config !== null && config !== undefined && !isObject(config)) {
    throw new TypeError("config must be null, undefined, or an object");
  }

  config = { eventLoopMonitoringPrecision: 10, ...config };

  for (const metric of Object.values(metrics)) {
    metric(config);
  }
}
