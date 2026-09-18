-- =============================================================================
-- aetheros 数据契约  v1.0.0
-- 目标：SQLite 3.53.4（2026-07-24 发布），驱动 better-sqlite3 13.0.3
-- 真源地位：本文件是 docs/SPEC.md §6 的展开。冲突以 SPEC.md 为准。
--
-- 三条不可协商的语义：
--   1. 只追加 —— agent 不得修改自身的审计记录（AC-10）
--   2. 哈希链 —— 任何篡改必须导致校验失败并抛 tamper-detected（AC-10）
--   3. 证据双区间 —— byte_* 为权威地址，utf16_* 为渲染用（ADR-011）
--
-- 约定：
--   - 时间统一 TEXT（ISO-8601 UTC，形如 2026-09-19T01:14:04.000Z）
--   - 所有 hash 为小写 hex 字符串
--   - 向量以 BLOB 存 Float32Array（小端），MVP 用暴力余弦检索
-- =============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- -----------------------------------------------------------------------------
-- 元信息
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_meta (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR REPLACE INTO schema_meta(key, value) VALUES
  ('schema_version', '1.0.0'),
  ('min_sqlite_version', '3.34.0'),   -- FTS5 trigram tokenizer 的最低要求
  ('target_sqlite_version', '3.53.4'),
  ('fts_tokenizer', 'trigram');

-- -----------------------------------------------------------------------------
-- 配置
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,          -- JSON 编码
  is_default  INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- evidence.mode 默认 strict；lenient 只能显式开启，且必须被 UI/trace 永久标记（AC-12）
INSERT OR IGNORE INTO settings(key, value, is_default) VALUES
  ('evidence.mode', '"strict"', 1),
  ('retrieval.fusion_weight', '0.5', 1),      -- AC-06：w = 0.5，必须严格 < 1
  ('runtime.threads', 'null', 1),             -- null 表示由 autoThreads() 决定，夹到 [2,4]
  ('telemetry.otlp_endpoint', 'null', 1);     -- 未配置 = 零出站（AC-01）

-- -----------------------------------------------------------------------------
-- 模型资源
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
  id            TEXT PRIMARY KEY,             -- uuid
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('llm','embedding','reranker')),
  backend       TEXT NOT NULL CHECK (backend IN ('node-llama-cpp','ollama')),
  file_path     TEXT,                         -- 本机路径；null 表示远端/托管
  file_sha256   TEXT,
  quant         TEXT,                         -- 例 'Q4_K_M'
  param_count_b REAL,                         -- 例 7.6
  resident_mb   INTEGER,                      -- 实测常驻内存，bench 后回填
  ctx_limit     INTEGER,
  threads       INTEGER CHECK (threads IS NULL OR (threads >= 2 AND threads <= 4)),
  load_state    TEXT NOT NULL DEFAULT 'unloaded'
                CHECK (load_state IN ('unloaded','loading','loaded','failed')),
  -- 加载器锁定语义：仅「文件存在但加载失败」才置 failed；文件不存在保持可重试（AC-14）
  load_failed_permanent INTEGER NOT NULL DEFAULT 0 CHECK (load_failed_permanent IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_models_kind_state ON models(kind, load_state);

-- -----------------------------------------------------------------------------
-- 文档与切块（检索侧）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id            TEXT PRIMARY KEY,
  source_path   TEXT NOT NULL,
  document_hash TEXT NOT NULL,                -- 源文件字节的 SHA-256，证据链的信任根
  byte_size     INTEGER NOT NULL CHECK (byte_size >= 0),
  mime          TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_path ON documents(source_path);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(document_hash);

CREATE TABLE IF NOT EXISTS chunks (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- ===== 证据双区间（ADR-011，不可只存其一）=====
  byte_start    INTEGER NOT NULL CHECK (byte_start >= 0),   -- 权威地址，抗重新编码
  byte_end      INTEGER NOT NULL CHECK (byte_end   >= byte_start),
  utf16_start   INTEGER NOT NULL CHECK (utf16_start >= 0),  -- 渲染用，对齐 JS String 索引
  utf16_end     INTEGER NOT NULL CHECK (utf16_end   >= utf16_start),
  -- 不变式（应用层断言 + 测试）：
  --   decode(document_bytes)[utf16_start : utf16_end] === text
  -- 只存 byte_* 会在中文上静默错位：JS String 索引是 UTF-16 code unit，不是字节。

  text          TEXT NOT NULL,
  content_hash  TEXT NOT NULL,                -- chunk 文本 SHA-256；入库时的快照
  token_count   INTEGER,
  embedding     BLOB,                         -- Float32Array 小端，dense 检索用
  embedding_dim INTEGER,                      -- 与 embedding 配套，便于校验
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_byte ON chunks(document_id, byte_start, byte_end);
CREATE INDEX IF NOT EXISTS idx_chunks_hash ON chunks(content_hash);

-- ===== FTS5 虚表（ADR-010：中文必须 trigram，unicode61 不切中文）=====
-- 外部内容表模式：内容存 chunks.text，FTS 只保存索引，避免双份存储。
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  text,
  content = 'chunks',
  content_rowid = 'id',
  tokenize = 'trigram'
);
-- 已知限制：trigram 以 3 字符为最小单位 —— 查询词 < 3 字（尤其是中文单字/双字词）
-- 不会命中 FTS 索引。应用层必须降级为 LIKE 兜底，或显式返回空并提示，不得静默返回 0 条。

-- 外部内容表同步触发器
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
END;
CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, text)
    VALUES ('delete', old.id, old.text);
END;
CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, text)
    VALUES ('delete', old.id, old.text);
  INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
END;

-- -----------------------------------------------------------------------------
-- 运行与 trace（审计侧，只追加）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS runs (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,              -- 用 session_id 而非 user_id（数据最小化）
  status          TEXT NOT NULL CHECK (status IN ('running','completed','aborted','failed')),
  evidence_mode   TEXT NOT NULL CHECK (evidence_mode IN ('strict','lenient')),
  model_id        TEXT REFERENCES models(id),
  threads         INTEGER CHECK (threads IS NULL OR (threads >= 2 AND threads <= 4)),
  -- 出站请求计数：AC-01 的机器证据，默认 0，随审计包导出
  outbound_count  INTEGER NOT NULL DEFAULT 0 CHECK (outbound_count >= 0),
  loopback_count  INTEGER NOT NULL DEFAULT 0 CHECK (loopback_count  >= 0),
  started_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ended_at        TEXT,
  retain_until    TEXT NOT NULL               -- started_at + 180 天（AC-13）
);
CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);

CREATE TABLE IF NOT EXISTS spans (
  id                TEXT PRIMARY KEY,
  run_id            TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  parent_span_id    TEXT REFERENCES spans(id),
  trace_id          TEXT NOT NULL,
  name              TEXT NOT NULL,
  kind              TEXT NOT NULL CHECK (kind IN
                      ('run','llm','tool','retrieve','gate','evolve','net')),
  -- ReAct 轮次：UI 的分组单位（不只是 trace 层级）。以 OTel attribute
  -- agentos.react.loop_index 为准，此处冗余以便 GROUP BY。
  react_loop_index  INTEGER CHECK (react_loop_index IS NULL OR react_loop_index >= 0),
  status            TEXT NOT NULL CHECK (status IN ('ok','error','refused')),
  started_at        TEXT NOT NULL,
  ended_at          TEXT,
  duration_ms       INTEGER,
  attributes        TEXT,                     -- JSON；OTel attribute 全量
  -- 出站计数写入每一条 trace
  outbound_count    INTEGER NOT NULL DEFAULT 0 CHECK (outbound_count >= 0),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_spans_run ON spans(run_id, started_at);
CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_spans_loop ON spans(run_id, react_loop_index);

-- 只追加：spans 禁止 UPDATE / DELETE（AC-10）
CREATE TRIGGER IF NOT EXISTS spans_no_update BEFORE UPDATE ON spans BEGIN
  SELECT RAISE(ABORT, 'spans is append-only: UPDATE forbidden (AC-10)');
END;
CREATE TRIGGER IF NOT EXISTS spans_no_delete BEFORE DELETE ON spans BEGIN
  SELECT RAISE(ABORT, 'spans is append-only: DELETE forbidden (AC-10)');
END;

-- -----------------------------------------------------------------------------
-- 断言与证据（Evidence Gate）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  span_id       TEXT REFERENCES spans(id),
  ordinal       INTEGER NOT NULL,             -- 同一 run 内的断言序号
  text          TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN
                  ('verified','unverified','refused','failed','error')),
  -- 五态互斥（SPEC §8.1）。refused 是产品的正确工作结果，不是故障。
  gate_mode     TEXT NOT NULL CHECK (gate_mode IN ('strict','lenient')),
  reason        TEXT,                         -- 拦截/失败原因，人类可读
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_claims_run ON claims(run_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

CREATE TABLE IF NOT EXISTS evidence (
  id            TEXT PRIMARY KEY,
  claim_id      TEXT REFERENCES claims(id) ON DELETE CASCADE,
  run_id        TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  chunk_id      TEXT REFERENCES chunks(id),
  -- 检索信号
  retriever     TEXT NOT NULL CHECK (retriever IN ('fts5','dense','rerank','fusion')),
  score         REAL,
  rrf_score     REAL,
  rerank_score  REAL,
  -- 命中位置（双区间，与 chunks 同源语义）
  byte_start    INTEGER,
  byte_end      INTEGER,
  utf16_start   INTEGER,
  utf16_end     INTEGER,
  -- 哈希校验：检索成功但内容哈希与入库时不一致 → 判 failed（不是 unverified）
  content_hash_at_index TEXT,
  content_hash_now      TEXT,
  hash_matches INTEGER CHECK (hash_matches IS NULL OR hash_matches IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_evidence_claim ON evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_evidence_chunk ON evidence(chunk_id);

CREATE TRIGGER IF NOT EXISTS evidence_no_update BEFORE UPDATE ON evidence BEGIN
  SELECT RAISE(ABORT, 'evidence is append-only: UPDATE forbidden (AC-10)');
END;
CREATE TRIGGER IF NOT EXISTS evidence_no_delete BEFORE DELETE ON evidence BEGIN
  SELECT RAISE(ABORT, 'evidence is append-only: DELETE forbidden (AC-10)');
END;

-- -----------------------------------------------------------------------------
-- 出站请求明细（AC-01 可机检）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbound_requests (
  id         TEXT PRIMARY KEY,
  run_id     TEXT REFERENCES runs(id),
  span_id    TEXT REFERENCES spans(id),
  host       TEXT NOT NULL,
  direction  TEXT NOT NULL CHECK (direction IN ('outbound','loopback')),
  -- 口径：出站 = 非回环地址（非 127.0.0.0/8、::1、localhost）
  reason     TEXT NOT NULL,                   -- 触发原因，用户可查看
  ts         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_outbound_run ON outbound_requests(run_id, ts);
CREATE INDEX IF NOT EXISTS idx_outbound_dir ON outbound_requests(direction, ts);

CREATE TRIGGER IF NOT EXISTS outbound_no_update BEFORE UPDATE ON outbound_requests BEGIN
  SELECT RAISE(ABORT, 'outbound_requests is append-only: UPDATE forbidden');
END;
CREATE TRIGGER IF NOT EXISTS outbound_no_delete BEFORE DELETE ON outbound_requests BEGIN
  SELECT RAISE(ABORT, 'outbound_requests is append-only: DELETE forbidden');
END;

-- -----------------------------------------------------------------------------
-- 哈希链（AC-10）
-- -----------------------------------------------------------------------------
-- hash = SHA256(prev_hash || payload_hash || entity || entity_id || created_at)
-- 计算在应用层（SQLite 无内建 SHA-256）；本表只负责链式存储与不可变。
CREATE TABLE IF NOT EXISTS hash_chain (
  seq          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity       TEXT NOT NULL,                 -- 'spans' / 'evidence' / 'claims'
  entity_id    TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  prev_hash    TEXT NOT NULL,                 -- 首行为 'genesis'
  hash         TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_chain_entity ON hash_chain(entity, entity_id);

CREATE TRIGGER IF NOT EXISTS chain_no_update BEFORE UPDATE ON hash_chain BEGIN
  SELECT RAISE(ABORT, 'hash_chain is append-only: UPDATE forbidden (AC-10)');
END;
CREATE TRIGGER IF NOT EXISTS chain_no_delete BEFORE DELETE ON hash_chain BEGIN
  SELECT RAISE(ABORT, 'hash_chain is append-only: DELETE forbidden (AC-10)');
END;

-- -----------------------------------------------------------------------------
-- 自进化（F7）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS skill_versions (
  id            TEXT PRIMARY KEY,
  skill_id      TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL,
  manifest      TEXT NOT NULL,                -- .skill.json 原文，Zod 校验过的 JSON
  parent_id     TEXT REFERENCES skill_versions(id),   -- 血缘
  baseline_seed INTEGER NOT NULL,             -- 对照组固定 seed（ADR-012）
  baseline_temp REAL NOT NULL DEFAULT 0.0,    -- 对照组 temperature = 0
  metric        TEXT,                         -- 对照组基准结果 JSON
  adopted       INTEGER NOT NULL DEFAULT 0 CHECK (adopted IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (skill_id, version)
);
CREATE INDEX IF NOT EXISTS idx_skillver_skill ON skill_versions(skill_id, version DESC);

CREATE TABLE IF NOT EXISTS skill_runs (
  id             TEXT PRIMARY KEY,
  skill_version_id TEXT NOT NULL REFERENCES skill_versions(id) ON DELETE CASCADE,
  run_id         TEXT REFERENCES runs(id),
  passed         INTEGER NOT NULL CHECK (passed IN (0,1)),
  detail         TEXT,                        -- 对照组逐条断言结果 JSON
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_skillruns_ver ON skill_runs(skill_version_id);

-- -----------------------------------------------------------------------------
-- 留存（AC-13：≥180 天）
-- -----------------------------------------------------------------------------
-- 应用层按日执行：删除 retain_until < now 的 runs 及其级联数据。
-- spans / evidence / hash_chain / outbound_requests 因 append-only 触发器不可删，
-- 清理须走专用维护路径（先禁用触发器再批量删），并在审计包中留痕。
CREATE INDEX IF NOT EXISTS idx_runs_retain ON runs(retain_until);

-- =============================================================================
-- 附：关键查询样例
-- =============================================================================
-- 1) BM25 检索（中文 trigram）
--   SELECT c.id, c.document_id, bm25(chunks_fts) AS score
--   FROM chunks_fts JOIN chunks c ON c.id = chunks_fts.rowid
--   WHERE chunks_fts MATCH ? ORDER BY score LIMIT ?;
--
-- 2) 哈希链校验（篡改即失败）
--   SELECT seq, entity, entity_id, prev_hash, hash FROM hash_chain ORDER BY seq;
--   -- 逐行重算，任一行不符 → 抛 tamper-detected
--
-- 3) 证据溯源（渲染用 utf16 区间）
--   SELECT d.source_path, c.utf16_start, c.utf16_end, e.score, e.retriever
--   FROM evidence e JOIN chunks c ON c.id = e.chunk_id
--   JOIN documents d ON d.id = c.document_id
--   WHERE e.claim_id = ?;
--
-- 4) 出站计数（AC-01 机检）
--   SELECT outbound_count, loopback_count FROM runs WHERE id = ?;
--   SELECT host, ts, reason FROM outbound_requests WHERE run_id = ? ORDER BY ts;
-- =============================================================================
