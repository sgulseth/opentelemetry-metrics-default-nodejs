import { Meter, MetricAttributes } from "@opentelemetry/api-metrics";

export interface Config<Labels extends MetricAttributes> {
  meter: Meter;
  prefix?: string;
  eventLoopMonitoringPrecision?: number;
  labels?: Labels;
}
