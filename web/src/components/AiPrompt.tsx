"use client";

import { useEffect, useState } from "react";
import type { Board } from "@/lib/board";
import Ico from "./Ico";
import s from "./ai.module.css";

type ProviderInfo = { id: string; name: string };

export default function AiPrompt({ onClose, onBoard }: { onClose: () => void; onBoard: (b: Board) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState("");

  // Discover configured providers so the user can pick when several are set.
  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((d: { providers?: ProviderInfo[] }) => {
        const list = d.providers ?? [];
        setProviders(list);
        if (list[0]) setProvider(list[0].id);
      })
      .catch(() => {});
  }, []);

  const generate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, provider }),
      });
      const data = await res.json();
      if (!res.ok || !data.board) {
        setError(data.error || "生成失败");
        return;
      }
      onBoard(data.board);
      onClose();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.title}>
          <Ico name="sparkles" size={17} color="#534ab7" />
          用 AI 生成流程图
        </div>
        <p className={s.hint}>一句话描述你的流程，AI 会生成可继续编辑的图（会替换当前模式的画布）。</p>
        {providers.length > 1 && (
          <div className={s.providerRow}>
            <span>模型</span>
            <select className={s.providerSelect} value={provider} onChange={(e) => setProvider(e.target.value)}>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {providers.length === 0 && <div className={s.note}>未检测到 AI 提供商，请在 web/.env.local 配置 AI_PROVIDER_1_* 后重试。</div>}
        <textarea
          className={s.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
          placeholder="例如：新用户注册流程 — 填写邮箱 → 验证邮箱 → 设置密码 → 完成；验证失败则重新发送验证码"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
          }}
        />
        {error && <div className={s.error}>{error}</div>}
        <div className={s.actions}>
          <button className={s.cancel} onClick={onClose}>
            取消
          </button>
          <button className={s.go} onClick={generate} disabled={!text.trim() || loading}>
            {loading ? "生成中…" : "生成"}
          </button>
        </div>
      </div>
    </div>
  );
}
