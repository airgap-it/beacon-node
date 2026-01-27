# Synapse Performance Tests

This folder contains performance tests executed to compare different versions of Synapse.

The goal of these tests is to measure and compare the behavior and response times of different Synapse versions (Matrix.org vs Element HQ) under load, using existing authentication and communication mechanisms.

The logs/ folder contains example of output from different scripts with different Synapse images.

---

## Test Setup

The tests are based on existing code and helper functions originally developed in `beacon-node-monitoring` repository:

- Matrix helper utilities
- Custom crypto authentication provider
- Existing login, room creation, and messaging logic

Where possible, existing logic was reused to ensure consistency with the production environment.

Only minimal adaptations were made to allow local execution and benchmarking.

---

## Switching Between Synapse Versions

To test different versions of Synapse, it is sufficient to:

1. Change the base image in the `Dockerfile`
2. Adapt the `docker-compose.yml` configuration if needed, especially for Postgres and Python versions

---

## Homeserver Rate Limiting Configuration

When running performance tests, Synapse rate limiting must be configured properly.

By default, Synapse limits login attempts, message sending, and other actions. If these limits are not increased, most test requests will fail with:

M_LIMIT_EXCEEDED (Too Many Requests)

For this reason, the following parameters must be updated in `homeserver.yaml` inside the Docker container, in the config/ folder.

### Example Configuration

```yaml
rc_message:
  per_second: 1000
  burst_count: 1000

rc_login:
  address:
    per_second: 1000
    burst_count: 1000
  account:
    per_second: 1000
    burst_count: 1000
  failed_attempts:
    per_second: 1000
    burst_count: 1000
```

Then containers must be restarted.  

---

## Conclusion (Internal Evaluation)

The new Element HQ Synapse implementation demonstrates a clear and consistent performance improvement over the previous matrixdotorg-based version.

All tested operations (Beacon-style login, room creation, and message sending) showed reduced response times and improved stability under load.

### Key Observations

- Average response times are significantly lower across all tested scenarios.
- Under sustained or high load conditions, the new version completes requests in much shorter times than the previous configuration.
- Rate limiting behavior is more predictable and easier to tune for performance testing and stress scenarios.
- No major compatibility issues were observed with tezos-matrix custom modules and authentication mechanisms.

Overall, the results confirm that the new Synapse version provides better scalability and efficiency and is technically suitable for current and future Beacon infrastructure requirements.

These tests were conducted on local machine, so they must be reproduced in prod environment before to consider them reliable. 
