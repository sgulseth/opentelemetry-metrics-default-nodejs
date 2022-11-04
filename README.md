# Opentelemetry Default NodeJS Metrics

This module collects default Node.js system metrics as opentelemtry metrics. This package and how the metrics are collected is based on the [siimon/prom-client](https://github.com/siimon/prom-client/) package


## Usage

```
import {collectDefaultMetrics} from '@sgulseth/opentelemetry-metrics-default-nodejs'

const meterProvider = new MeterProvider()
const meter = meterProvider.getMeter(appName)
collectDefaultMetrics({meter})
```
