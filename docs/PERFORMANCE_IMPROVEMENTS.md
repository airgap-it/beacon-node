# Performance Improvements Guide

This document outlines additional performance optimizations that can be implemented in the future. These are more aggressive or experimental settings that weren't included in the initial optimization.

## Current Optimizations Applied

✅ **Already Implemented:**
- Database connection pool increased (20 → 80 connections)
- Rate limiting relaxed (15 → 100 msg/sec)
- PostgreSQL tuned for 8GB usage
- Caching enabled (2x global factor, 100K event cache)
- Redis memory limited to 1GB

## Future Optimization Opportunities

### 0. Enable Sentry Error Tracking

**Current Status**: Sentry is configured but NOT active (commented out in homeserver.yaml)

**To Enable Sentry:**

1. **Update `docker/homeserver.yaml`** - Uncomment lines 151-152:
   ```yaml
   sentry:
     dsn: "{{SENTRY_DSN}}"
   ```

2. **Update `docker/synctl_entrypoint.sh`** - Add after line 7:
   ```bash
   sed -i "s|{{SENTRY_DSN}}|$SENTRY_DSN|g" /config/homeserver.yaml
   ```

3. **Use in docker-compose.yml**:
   ```yaml
   environment:
     SENTRY_DSN: "https://fc05bbc75d345906ed15de7d8ef76fc7@reporting.papers.tech/17"
   ```

4. **Optional performance monitoring** (use sparingly):
   ```yaml
   sentry:
     dsn: "{{SENTRY_DSN}}"
     traces_sample_rate: 0.01  # 1% sampling for production
   ```

**Benefits**:
- Real-time error tracking
- Performance bottleneck identification
- Crash reports and stack traces
- User impact metrics

**Note**: Requires Docker image rebuild after changes.

### 1. PostgreSQL Advanced Tuning

**When ready for more aggressive settings:**

```sql
-- JIT compilation (PostgreSQL 11+)
jit = on
jit_above_cost = 100000

-- Parallel query execution
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
parallel_setup_cost = 100
parallel_tuple_cost = 0.01

-- Advanced autovacuum for high-write workloads
autovacuum_vacuum_cost_delay = 2ms
autovacuum_vacuum_cost_limit = 2000
autovacuum_freeze_max_age = 200000000

-- Huge pages support (requires kernel configuration)
huge_pages = try
```

**Monitoring queries to add:**
```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. Redis Advanced Configuration

**For production environments with high throughput:**

```conf
# Redis.conf additions
tcp-backlog 1024
timeout 300
tcp-keepalive 60

# Disable persistence if purely caching
save ""
stop-writes-on-bgsave-error no
rdbcompression no
dbfilename ""

# Enable Redis modules for better performance
loadmodule /usr/lib/redis/modules/redisbloom.so
loadmodule /usr/lib/redis/modules/redisjson.so

# Threading for I/O (Redis 6+)
io-threads 4
io-threads-do-reads yes
```

### 3. Synapse Worker Specialization

**Split workers by function for better performance:**

```yaml
# event_persister.yaml - Dedicated event writer
worker_app: synapse.app.generic_worker
worker_name: event_persister1
worker_listeners:
  - type: http
    port: 8034
    resources:
      - names: [replication]
  - type: manhole
    port: 9000
worker_log_config: /config/worker_log_config.yaml
# Enable event persistence
run_background_tasks: true
```

**Add specialized workers:**
- `event_persister`: Handles event writing (1-2 instances)
- `federation_sender`: Handles outbound federation (1-2 instances)
- `media_repository`: Handles media (if re-enabled)
- `user_dir`: Handles user directory updates

### 4. Nginx Optimizations

**If using Nginx as reverse proxy:**

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types application/json text/plain application/javascript;
gzip_comp_level 6;

# Connection pooling
upstream synapse_workers {
    least_conn;
    server localhost:8083 max_fails=3 fail_timeout=30s;
    server localhost:8084 max_fails=3 fail_timeout=30s;
    server localhost:8085 max_fails=3 fail_timeout=30s;
    server localhost:8086 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Buffer tuning for large messages
client_body_buffer_size 256k;
client_max_body_size 100m;
proxy_buffer_size 128k;
proxy_buffers 8 256k;
proxy_busy_buffers_size 512k;
```

### 5. Synapse Experimental Features

**Test these in staging first:**

```yaml
# Experimental faster joins
experimental_features:
  faster_joins: true
  
# MSC3266: Room summary optimization
experimental_features:
  msc3266_enabled: true

# Optimized state resolution
state_resolution:
  max_events_per_room: 100
  
# Background task tuning
background_task_scheduler:
  min_batch_size: 10
  max_batch_size: 100
```

### 6. Database Schema Optimizations

**Custom indexes for Tezos/Beacon workload:**

```sql
-- Index for crypto auth lookups
CREATE INDEX CONCURRENTLY idx_users_creation_ts_name 
ON users(creation_ts DESC, name) 
WHERE name LIKE '%beacon%';

-- Index for large message queries
CREATE INDEX CONCURRENTLY idx_events_room_stream_partial 
ON events(room_id, stream_ordering DESC) 
WHERE type = 'm.room.message' AND contains(content, 'contract');

-- Partial index for active rooms
CREATE INDEX CONCURRENTLY idx_rooms_active 
ON rooms(room_id) 
WHERE NOT is_public;
```

### 7. Monitoring & Profiling

**Tools to set up:**

1. **Prometheus + Grafana**
   ```yaml
   # docker-compose addition
   prometheus:
     image: prom/prometheus
     volumes:
       - ./prometheus.yml:/etc/prometheus/prometheus.yml
   
   grafana:
     image: grafana/grafana
     ports:
       - "3000:3000"
   ```

2. **PostgreSQL monitoring**
   - pg_stat_statements extension
   - pgBadger for log analysis
   - pg_top for real-time monitoring

3. **Python profiling for Synapse**
   ```yaml
   # In homeserver.yaml
   enable_metrics: true
   metrics_port: 9090
   ```

### 8. Hardware Considerations

**For maximum performance:**

- **NVMe SSDs**: 10x IOPS improvement over SATA SSDs
- **CPU**: Prioritize single-thread performance for Python
- **RAM**: 32GB allows more aggressive caching
- **Network**: 10Gbps for federation-heavy workloads

### 9. Container Runtime Optimizations

**Docker alternatives:**

```bash
# Use Podman with native cgroups v2
podman run --cgroups=enabled --memory=4g --cpus=4

# Or containerd with better resource isolation
ctr run --memory-limit 4294967296 --cpu-quota 400000
```

### 10. Message Processing Pipeline

**For 100KB+ messages:**

1. **Enable compression at Matrix level:**
   ```yaml
   # In homeserver.yaml
   federation_client_compression: true
   ```

2. **Implement message chunking:**
   - Split large messages at application level
   - Use Matrix relations to link chunks
   - Reassemble on client side

3. **Background processing:**
   ```yaml
   # Defer non-critical processing
   background_updates:
     batch_size: 100
     sleep_duration_ms: 100
   ```

## Performance Testing

### Load Testing Tools

```bash
# Matrix-specific load testing
git clone https://github.com/matrix-org/sytest
cd sytest
./run-tests.pl --server-type synapse

# General load testing
apt-get install apache2-utils
ab -n 10000 -c 100 http://localhost:8008/_matrix/client/versions
```

### Metrics to Monitor

1. **Message send latency**: Time from send to receipt
2. **Database query time**: pg_stat_statements mean_time
3. **Worker queue depth**: Redis LIST lengths
4. **Memory usage**: Per-process RSS
5. **Federation lag**: Time to receive remote events

## Rollback Plan

If any optimization causes issues:

1. **Quick rollback:**
   ```bash
   docker-compose down
   git checkout docker/homeserver.yaml
   docker-compose up -d
   ```

2. **Database rollback:**
   ```sql
   -- Reset PostgreSQL settings
   ALTER SYSTEM RESET ALL;
   SELECT pg_reload_conf();
   ```

3. **Redis flush:**
   ```bash
   redis-cli FLUSHALL
   ```

## Notes

- Always test in staging first
- Monitor for 24-48 hours after changes
- Keep detailed logs of what was changed
- Document performance metrics before/after
- Have rollback plan ready