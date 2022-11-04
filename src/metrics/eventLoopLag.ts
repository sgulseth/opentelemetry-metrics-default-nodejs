import * as perfHooks from "perf_hooks";
import {
	BatchObservableResult,
	ObservableUpDownCounter,
	MetricAttributes,
} from "@opentelemetry/api-metrics";
import { Config } from "../config";

// Reported always.
const NODEJS_EVENTLOOP_LAG = "nodejs_eventloop_lag_seconds";

// Reported only when perf_hooks is available.
const NODEJS_EVENTLOOP_LAG_MIN = "nodejs_eventloop_lag_min_seconds";
const NODEJS_EVENTLOOP_LAG_MAX = "nodejs_eventloop_lag_max_seconds";
const NODEJS_EVENTLOOP_LAG_MEAN = "nodejs_eventloop_lag_mean_seconds";
const NODEJS_EVENTLOOP_LAG_STDDEV = "nodejs_eventloop_lag_stddev_seconds";
const NODEJS_EVENTLOOP_LAG_P50 = "nodejs_eventloop_lag_p50_seconds";
const NODEJS_EVENTLOOP_LAG_P90 = "nodejs_eventloop_lag_p90_seconds";
const NODEJS_EVENTLOOP_LAG_P99 = "nodejs_eventloop_lag_p99_seconds";

function reportEventloopLag<T extends MetricAttributes>(
	start: [number, number],
	batch: BatchObservableResult,
	gauge: ObservableUpDownCounter<T>,
	labels: T,
) {
	const delta = process.hrtime(start);
	const nanosec = delta[0] * 1e9 + delta[1];
	const seconds = nanosec / 1e9;

	batch.observe(gauge, seconds, labels);
}

export function reportEventloop<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : ({} as Attributes);

	const histogram = perfHooks.monitorEventLoopDelay({
		resolution: config.eventLoopMonitoringPrecision,
	});
	histogram.enable();

	const lag = meter.createObservableUpDownCounter<Attributes>(
		namePrefix + NODEJS_EVENTLOOP_LAG,
		{
			description: "Lag of event loop in seconds.",
		},
	);

	const lagMin = meter.createObservableUpDownCounter<Attributes>(
		namePrefix + NODEJS_EVENTLOOP_LAG_MIN,
		{
			description: "The minimum recorded event loop delay.",
		},
	);
	const lagMax = meter.createObservableUpDownCounter<Attributes>(
		namePrefix + NODEJS_EVENTLOOP_LAG_MAX,
		{
			description: "The maximum recorded event loop delay.",
		},
	);
	const lagMean = meter.createObservableUpDownCounter<Attributes>(
		namePrefix + NODEJS_EVENTLOOP_LAG_MEAN,
		{
			description: "The mean of the recorded event loop delays.",
		},
	);
	const lagStddev = meter.createObservableUpDownCounter<Attributes>(
		namePrefix + NODEJS_EVENTLOOP_LAG_STDDEV,
		{
			description: "The standard deviation of the recorded event loop delays.",
		},
	);
	const lagP50 = meter.createObservableUpDownCounter<Attributes>(
		namePrefix + NODEJS_EVENTLOOP_LAG_P50,
		{
			description: "The 50th percentile of the recorded event loop delays.",
		},
	);
	const lagP90 = meter.createObservableUpDownCounter<Attributes>(
		namePrefix + NODEJS_EVENTLOOP_LAG_P90,
		{
			description: "The 90th percentile of the recorded event loop delays.",
		},
	);
	const lagP99 = meter.createObservableUpDownCounter<Attributes>(
		namePrefix + NODEJS_EVENTLOOP_LAG_P99,
		{
			description: "The 99th percentile of the recorded event loop delays.",
		},
	);

	meter.addBatchObservableCallback(
		(result) => {
			const start = process.hrtime();
			setImmediate(reportEventloopLag, start, result, lag, labels);

			result.observe(lagMin, histogram.min / 1e9, labels);
			result.observe(lagMax, histogram.max / 1e9, labels);
			result.observe(lagMean, histogram.mean / 1e9, labels);
			result.observe(lagStddev, histogram.stddev / 1e9, labels);
			result.observe(lagP50, histogram.percentile(50) / 1e9, labels);
			result.observe(lagP90, histogram.percentile(90) / 1e9, labels);
			result.observe(lagP99, histogram.percentile(99) / 1e9, labels);

			histogram.reset();
		},
		[lag, lagMin, lagMax, lagMean, lagStddev, lagP50, lagP90, lagP99],
	);
}
