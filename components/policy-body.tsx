import Link from "next/link";

type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    if (lines[0].startsWith("## ")) {
      blocks.push({ type: "h2", text: lines[0].slice(3) });
      const rest = lines.slice(1).join(" ");
      if (rest) blocks.push({ type: "p", text: rest });
      continue;
    }
    if (lines.every((l) => l.startsWith("- "))) {
      blocks.push({ type: "ul", items: lines.map((l) => l.slice(2)) });
      continue;
    }
    blocks.push({ type: "p", text: lines.join(" ") });
  }
  return blocks;
}

// [label](/page) or [label](https://...). Text is rendered by React, so it is always escaped.
function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, href] = m;
    if (href.startsWith("/")) {
      parts.push(<Link key={key++} href={href}>{label}</Link>);
    } else if (/^(https:\/\/|mailto:|tel:)/.test(href)) {
      const external = href.startsWith("http");
      parts.push(
        <a key={key++} href={href} {...(external ? { target: "_blank" } : {})} rel="noopener noreferrer">
          {label}
        </a>,
      );
    } else {
      parts.push(label);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export default function PolicyBody({ body }: { body: string }) {
  return (
    <>
      {parse(body).map((b, i) =>
        b.type === "h2" ? (
          <h2 key={i}>{b.text}</h2>
        ) : b.type === "ul" ? (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inline text={b.text} />
          </p>
        ),
      )}
    </>
  );
}
