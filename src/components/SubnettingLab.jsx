import { useEffect, useMemo, useState } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sanitizeIPv4Input(raw) {
  // Keep input “editable” (so users can type/delete freely) while preventing
  // weird invalid states like empty octets being interpreted as 0.
  let s = String(raw ?? "");
  // Only digits and dots.
  s = s.replace(/[^0-9.]/g, "");
  // Collapse multiple dots.
  s = s.replace(/\.{2,}/g, ".");

  const parts = s.split(".");
  const kept = [];
  for (let i = 0; i < parts.length && kept.length < 4; i += 1) {
    const p = parts[i];
    // Allow empty part only if user is currently typing a dot (handled by join later).
    kept.push(p.slice(0, 3));
  }

  // Re-join, but keep at most 3 dots.
  s = kept.join(".");
  const dots = (s.match(/\./g) || []).length;
  if (dots > 3) {
    // Trim extra segments.
    s = kept.slice(0, 4).join(".");
  }

  return s;
}

function parseIPv4(ip) {
  const s = ip.trim();
  const parts = s.split(".");
  if (parts.length !== 4) return null;

  const nums = [];
  for (const p of parts) {
    // Reject empty octets and non-integers.
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    nums.push(n);
  }
  return nums;
}

function ipToInt(parts) {
  // unsigned 32-bit
  return ((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function prefixToMaskInt(prefix) {
  const p = clamp(prefix, 0, 32);
  if (p === 0) return 0;
  return (0xffffffff << (32 - p)) >>> 0;
}

function maskIntToDotted(maskInt) {
  return intToIp(maskInt >>> 0);
}

function isValidContiguousMask(maskInt) {
  // Valid masks are 111...1100..00.
  // Let inv = ~mask. A valid mask means inv is 00..0011..11 -> inv & (inv + 1) === 0
  const inv = (~maskInt) >>> 0;
  return (inv & (inv + 1)) === 0;
}

function maskDottedToInt(maskStr) {
  const parts = parseIPv4(maskStr);
  if (!parts) return null;
  const maskInt = ipToInt(parts);
  if (!isValidContiguousMask(maskInt)) return null;
  return maskInt >>> 0;
}

function popcount32(x) {
  let n = x >>> 0;
  let c = 0;
  while (n) {
    n &= n - 1;
    c += 1;
  }
  return c;
}

function toBinary32(n) {
  return (n >>> 0).toString(2).padStart(32, "0");
}

function formatBinaryDotted(bin32) {
  return [0, 8, 16, 24].map((i) => bin32.slice(i, i + 8)).join(".");
}

function makeQuizQuestion() {
  const templates = [
    () => {
      const prefix = 24 + Math.floor(Math.random() * 7); // /24.. /30
      const hosts = Math.max(0, 2 ** (32 - prefix) - 2);
      return {
        kind: "hosts",
        prompt: `How many usable host IPs are in a /${prefix} subnet?`,
        answer: String(hosts),
        help: "Usable hosts = 2^(host bits) − 2 (network + broadcast).",
      };
    },
    () => {
      const prefix = 8 + Math.floor(Math.random() * 17); // /8.. /24
      const mask = maskIntToDotted(prefixToMaskInt(prefix));
      return {
        kind: "mask",
        prompt: `What is the dotted-decimal subnet mask for /${prefix}?`,
        answer: mask,
        help: "A /p mask has p leading 1s, then 0s. Convert each octet to decimal.",
      };
    },
    () => {
      // membership check
      const prefix = 24 + Math.floor(Math.random() * 6); // /24.. /29
      const base = ipToInt([10, 0, Math.floor(Math.random() * 256), 0]);
      const mask = prefixToMaskInt(prefix);
      const network = base & mask;
      const inSubnet = Math.random() < 0.6;
      const candidate = inSubnet
        ? network + Math.floor(Math.random() * 2 ** (32 - prefix))
        : (network + 2 ** (32 - prefix) + Math.floor(Math.random() * 256)) >>> 0;

      return {
        kind: "member",
        prompt: `Is ${intToIp(candidate)} inside subnet ${intToIp(network)}/${prefix}? (yes/no)`,
        answer: inSubnet ? "yes" : "no",
        help: "A host is in the subnet if (IP AND mask) equals the network address.",
      };
    },
  ];

  return templates[Math.floor(Math.random() * templates.length)]();
}

export default function SubnettingLab() {
  const [ip, setIp] = useState("192.168.1.130");
  const [prefix, setPrefix] = useState(24);
  const [maskMode, setMaskMode] = useState("prefix"); // prefix | dotted
  const [maskDotted, setMaskDotted] = useState("255.255.255.0");

  const [quiz, setQuiz] = useState(() => makeQuizQuestion());
  const [quizInput, setQuizInput] = useState("");
  const [quizFeedback, setQuizFeedback] = useState(null);

  const derived = useMemo(() => {
    const ipParts = parseIPv4(ip);
    if (!ipParts) {
      return { error: "Enter a valid IPv4 address (e.g., 192.168.1.10)." };
    }

    let maskInt;
    let prefixLen;
    if (maskMode === "prefix") {
      prefixLen = clamp(Number(prefix), 0, 32);
      maskInt = prefixToMaskInt(prefixLen);
    } else {
      maskInt = maskDottedToInt(maskDotted);
      if (maskInt == null) {
        return {
          error: "Enter a valid subnet mask (contiguous 1s then 0s), e.g. 255.255.255.0.",
        };
      }
      prefixLen = popcount32(maskInt);
    }

    const ipInt = ipToInt(ipParts);
    const networkInt = (ipInt & maskInt) >>> 0;
    const hostBits = 32 - prefixLen;
    const size = hostBits === 32 ? 2 ** 32 : 2 ** hostBits;
    const broadcastInt = (networkInt + size - 1) >>> 0;

    const usableHosts = prefixLen >= 31 ? 0 : size - 2;
    const firstHost = usableHosts ? (networkInt + 1) >>> 0 : null;
    const lastHost = usableHosts ? (broadcastInt - 1) >>> 0 : null;

    return {
      ipInt,
      ipStr: intToIp(ipInt),
      prefixLen,
      maskInt,
      maskStr: maskIntToDotted(maskInt),
      networkInt,
      networkStr: intToIp(networkInt),
      broadcastInt,
      broadcastStr: intToIp(broadcastInt),
      hostBits,
      size,
      usableHosts,
      firstHostStr: firstHost == null ? "—" : intToIp(firstHost),
      lastHostStr: lastHost == null ? "—" : intToIp(lastHost),
      ipBin: toBinary32(ipInt),
      maskBin: toBinary32(maskInt),
      netBin: toBinary32(networkInt),
    };
  }, [ip, prefix, maskMode, maskDotted]);

  useEffect(() => {
    if (maskMode === "prefix") {
      setMaskDotted(maskIntToDotted(prefixToMaskInt(clamp(Number(prefix), 0, 32))));
    }
  }, [maskMode, prefix]);

  const checkQuiz = () => {
    const normalized = quizInput.trim().toLowerCase();
    const expected = quiz.answer.trim().toLowerCase();
    const ok = normalized === expected;
    setQuizFeedback(ok ? { ok: true, text: "Correct!" } : { ok: false, text: `Not quite. Hint: ${quiz.help}` });
  };

  const nextQuiz = () => {
    setQuiz(makeQuizQuestion());
    setQuizInput("");
    setQuizFeedback(null);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Subnetting Lab</h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Subnetting is about splitting IP address space into groups.
          <span className="text-slate-900 font-medium"> Network bits</span> identify the group
          (subnet) and <span className="text-slate-900 font-medium">host bits</span> identify a device
          inside that subnet.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Inputs</h2>

          <label className="block text-sm text-slate-700">
            IP address
            <input
              className="mt-1 w-full rounded-lg bg-white border border-slate-200 px-3 py-2"
              value={ip}
              onChange={(e) => setIp(sanitizeIPv4Input(e.target.value))}
              onBlur={() => setIp((v) => v.replace(/\.$/, ""))}
              inputMode="numeric"
              placeholder="192.168.1.130"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMaskMode("prefix")}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                maskMode === "prefix"
                  ? "border-brand-300 bg-brand-50 text-slate-900"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              Use prefix length (/24)
            </button>
            <button
              onClick={() => setMaskMode("dotted")}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                maskMode === "dotted"
                  ? "border-brand-300 bg-brand-50 text-slate-900"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              Use dotted mask (255.255.255.0)
            </button>
          </div>

          {maskMode === "prefix" ? (
            <label className="block text-sm text-slate-700">
              Prefix length
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={prefix}
                  onChange={(e) => setPrefix(Number(e.target.value))}
                  className="w-full"
                />
                <span className="w-14 text-right text-slate-900 font-medium">/{prefix}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">/{prefix} means the first {prefix} bits are the network.</p>
            </label>
          ) : (
            <label className="block text-sm text-slate-700">
              Subnet mask
              <input
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 px-3 py-2"
                value={maskDotted}
                onChange={(e) => setMaskDotted(sanitizeIPv4Input(e.target.value))}
                onBlur={() => setMaskDotted((v) => v.replace(/\.$/, ""))}
                inputMode="numeric"
                placeholder="255.255.255.0"
              />
              <p className="text-xs text-slate-500 mt-1">Only “contiguous” masks are valid (all 1s, then all 0s).</p>
            </label>
          )}

          {derived.error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {derived.error}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-500">Mask</p>
                  <p className="font-medium text-slate-900">
                    {derived.maskStr} (/{derived.prefixLen})
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Usable hosts</p>
                  <p className="font-medium text-slate-900">{derived.usableHosts}</p>
                </div>
                <div>
                  <p className="text-slate-500">Network</p>
                  <p className="font-medium text-slate-900">{derived.networkStr}</p>
                </div>
                <div>
                  <p className="text-slate-500">Broadcast</p>
                  <p className="font-medium text-slate-900">{derived.broadcastStr}</p>
                </div>
                <div>
                  <p className="text-slate-500">First host</p>
                  <p className="font-medium text-slate-900">{derived.firstHostStr}</p>
                </div>
                <div>
                  <p className="text-slate-500">Last host</p>
                  <p className="font-medium text-slate-900">{derived.lastHostStr}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Visual: network bits vs host bits</h2>
          <p className="text-sm text-slate-600">
            Each IPv4 address has 32 bits. The mask tells us how many bits belong to the subnet
            (network) and how many bits are for hosts.
          </p>

          {!derived.error && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">Bits (left → right)</div>
              <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}>
                {derived.ipBin.split("").map((bit, idx) => {
                  const isNetwork = idx < derived.prefixLen;
                  return (
                    <div
                      key={idx}
                      title={`bit ${idx + 1} (${isNetwork ? "network" : "host"})`}
                      className={
                        "h-7 rounded-md flex items-center justify-center text-[10px] font-mono border " +
                        (isNetwork
                          ? "bg-brand-50 border-brand-200 text-brand-700"
                          : "bg-white border-slate-200 text-slate-700")
                      }
                    >
                      {bit}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-900 font-medium">Binary view</p>
                <div className="mt-2 grid gap-2 text-xs font-mono text-slate-800">
                  <div>
                    <span className="text-slate-500">IP: </span>
                    {formatBinaryDotted(derived.ipBin)}
                  </div>
                  <div>
                    <span className="text-slate-500">Mask: </span>
                    {formatBinaryDotted(derived.maskBin)}
                  </div>
                  <div>
                    <span className="text-slate-500">Network (IP AND Mask): </span>
                    {formatBinaryDotted(derived.netBin)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500">Special case: /31 and /32 don’t have “usable host ranges” in the classic sense.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Practice quiz</h2>
            <p className="text-sm text-slate-600 mt-1">Type your answer and check it. Then generate a new question.</p>
          </div>
          <button
            onClick={nextQuiz}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm"
          >
            New question
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-slate-800">{quiz.prompt}</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm"
              value={quizInput}
              onChange={(e) => setQuizInput(e.target.value)}
              placeholder={quiz.kind === "member" ? "yes or no" : "your answer"}
            />
            <button
              onClick={checkQuiz}
              className="rounded-lg bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 text-sm font-medium"
            >
              Check
            </button>
          </div>

          {quizFeedback && (
            <div
              className={
                "mt-3 rounded-lg border p-3 text-sm " +
                (quizFeedback.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800")
              }
            >
              {quizFeedback.text}
              {!quizFeedback.ok && (
                <div className="text-xs text-slate-600 mt-2">
                  Expected answer: <span className="font-mono">{quiz.answer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
