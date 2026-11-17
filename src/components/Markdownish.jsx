// Tiny, safe renderer for the **bold** and "- bullet" markdown that Gemini returns.
// No HTML is ever injected: everything is rendered as React text nodes.
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-zinc-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function Markdownish({ text }) {
  const lines = String(text || "").split(/\r?\n/);

  return (
    <div className="space-y-1.5 text-sm leading-6 text-zinc-600">
      {lines.map((raw, index) => {
        const line = raw.trim();
        if (!line) return <div key={index} className="h-1" />;

        const bullet = line.match(/^[-*•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              <span>{renderInline(bullet[1])}</span>
            </div>
          );
        }

        return <p key={index}>{renderInline(line.replace(/^#+\s*/, ""))}</p>;
      })}
    </div>
  );
}

export default Markdownish;
