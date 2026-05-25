# GPU Transcription Setup (RTX 5050)

## Overview

This document describes the local GPU-accelerated transcription setup for Vexa using CUDA on Windows with Docker Desktop + WSL2.

## Hardware

- **GPU:** NVIDIA GeForce RTX 5050 Laptop
- **VRAM:** 8GB
- **Compute Capability:** 12.0 (Blackwell architecture)
- **Driver:** 596.36

## Configuration

### Environment Variables (`.env`)

```env
# Local GPU Transcription — no cloud dependency
LOCAL_TRANSCRIPTION=true
TRANSCRIPTION_SERVICE_URL=http://transcription-lb:80/v1/audio/transcriptions
TRANSCRIPTION_SERVICE_TOKEN=vexa-local-gpu-token
MODEL_SIZE=large-v3-turbo
COMPUTE_TYPE=float16
```

**Key Settings:**
- `LOCAL_TRANSCRIPTION=true` — Enables local GPU transcription
- `MODEL_SIZE=large-v3-turbo` — Best quality/speed ratio
- `COMPUTE_TYPE=float16` — Required for RTX 5050 (compute 12.0) — `int8` fails with cuBLAS

### Docker Compose (`docker-compose.yml`)

The GPU transcription service is integrated directly into the main compose file:

```yaml
transcription-worker:
  build:
    context: ../../services/transcription-service
    dockerfile: Dockerfile
  environment:
    - DEVICE=cuda
    - COMPUTE_TYPE=float16
    - API_TOKEN=${TRANSCRIPTION_SERVICE_TOKEN}
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

### Nginx Load Balancer (`nginx-transcription.conf`)

Single-worker configuration for single-GPU setups:

```nginx
upstream transcription_workers {
    least_conn;
    server transcription-worker-1:8000 max_fails=1 fail_timeout=10s;
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vexa Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ API Gateway  │  │ Meeting API  │  │ Runtime API      │  │
│  │ (port 8056)  │  │ (port 8080)  │  │ (port 8090)      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           │                                  │
│                  ┌────────▼────────┐                        │
│                  │ Transcription   │                        │
│                  │   Service       │                        │
│                  │                 │                        │
│                  │ • Worker (GPU)  │                        │
│                  │ • Nginx LB      │                        │
│                  │ • Whisper API   │                        │
│                  └────────┬────────┘                        │
│                           │                                  │
│                  ┌────────▼────────┐                        │
│                  │   NVIDIA CUDA   │                        │
│                  │   (RTX 5050)    │                        │
│                  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Meeting API** receives join request → **Runtime API** spawns **vexa-bot** container
2. **vexa-bot** joins meeting via browser, captures audio per speaker
3. Audio sent via HTTP to **Transcription Service** (Nginx LB → Worker)
4. **Worker** uses Whisper with CUDA acceleration → text returned
5. Segments published to **Redis streams**
6. **Transcription Collector** (in Meeting API) consumes streams → writes to PostgreSQL
7. **Dashboard** reads transcripts from DB via **API Gateway**

## Testing

### Check Transcription Service Health

```bash
curl http://localhost:8083/health
```

Expected response:
```json
{
  "status": "healthy",
  "worker_id": "1",
  "model": "large-v3-turbo",
  "device": "cuda",
  "gpu_available": true,
  "compute_type": "float16"
}
```

### Join a Meeting

```bash
# Create API token (one-time)
curl -X POST "http://localhost:8056/admin/users/1/tokens?scopes=bot,browser,tx&name=transcription-test" \
  -H "X-Admin-API-Key: changeme"

# Join Google Meet
curl -X POST "http://localhost:8056/bots" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-token>" \
  --data-raw '{"meeting_url": "https://meet.google.com/YOUR-MEETING-ID"}'
```

### Get Transcript

```bash
curl "http://localhost:8056/transcripts/google_meet/YOUR-MEETING-ID" \
  -H "X-API-Key: <your-token>"
```

## Troubleshooting

### cuBLAS Error

If you see `cuBLAS failed with status CUBLAS_STATUS_NOT_SUPPORTED`:

1. Check your GPU compute capability: `nvidia-smi --query-gpu=compute_cap --format=csv`
2. For compute capability ≥ 12.0 (RTX 5050, 40 series), use `COMPUTE_TYPE=float16`
3. For older GPUs, `COMPUTE_TYPE=int8` works fine

### GPU Not Detected

```bash
# Verify Docker can access GPU
docker run --rm --gpus all nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04 nvidia-smi
```

### Transcription Not Working

1. Check transcription worker logs: `docker logs transcription-worker-1`
2. Verify Redis connectivity: `docker exec -it vexa-redis-1 redis-cli ping`
3. Check PostgreSQL: `docker exec -it vexa-postgres-1 pg_isready -U postgres`

## Performance

- **Model:** large-v3-turbo + float16
- **VRAM Usage:** ~4-5GB
- **Speed:** Real-time transcription (sub-second latency per segment)
- **Concurrency:** 10 simultaneous transcriptions (configurable via `MAX_CONCURRENT_TRANSCRIPTIONS`)

## Files

- `deploy/compose/docker-compose.yml` — Main compose file with GPU transcription
- `deploy/compose/nginx-transcription.conf` — Nginx load balancer config
- `services/transcription-service/Dockerfile` — GPU-enabled Dockerfile
- `services/transcription-service/main.py` — Whisper API implementation
- `services/transcription-service/.env.example` — Environment variable reference
