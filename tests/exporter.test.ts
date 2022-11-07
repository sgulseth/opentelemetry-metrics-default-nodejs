import {test} from "node:test";
import * as assert from "assert/strict";

import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";

import { collectDefaultMetrics } from "../src";

test("exporter", async () => {
  const prometheusExporter = new PrometheusExporter({
    preventServerStart: true,
  });
  const meterProvider = new MeterProvider();
  meterProvider.addMetricReader(prometheusExporter);
  const meter = meterProvider.getMeter("tests");

  collectDefaultMetrics({ meter });

  {
    const collectedMetrics = await prometheusExporter.collect();

    assert.equal(collectedMetrics.errors.length, 0);
  }

  await new Promise<void>(resolve => setTimeout(() => resolve(), 500))
  {
    const collectedMetrics = await prometheusExporter.collect();

    console.log(collectedMetrics.resourceMetrics.scopeMetrics[0].metrics);
    assert.equal(collectedMetrics.resourceMetrics.scopeMetrics[0].metrics.length, 25);
    assert.equal(collectedMetrics.errors.length, 0);
  }
});
