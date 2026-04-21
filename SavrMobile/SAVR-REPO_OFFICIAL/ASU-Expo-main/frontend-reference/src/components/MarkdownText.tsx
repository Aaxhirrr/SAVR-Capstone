import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type Props = {
  text: string;
};

// Normalize minor artifacts that often appear in LLM output before markdown parsing
function normalize(text: string): string {
  if (!text) return '';
  let t = text
    // Remove lines that are just punctuation (., -, •)
    .replace(/^[\s]*[\-•\.][\s]*$/gm, '')
    // Merge broken ordered list items: "1.\nContent" -> "1. Content"
    .replace(/^(\d+)\.\s*$\n^([^\s].*)$/gm, '$1. $2')
    // Merge broken unordered list items: "-\nContent" -> "* Content"
    .replace(/^[-•]\s*$\n^([^\s].*)$/gm, '* $1')
    // Normalize bullet symbols to '*'
    .replace(/^•\s+/gm, '* ')
    // Collapse 3+ blank lines
    .replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

export default function MarkdownText({ text }: Props) {
  const content = normalize(text || '');
  return (
    <div className="prose prose-slate dark:prose-invert max-w-[68ch] text-[16px] leading-relaxed font-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: (props: any) => <h1 className="mt-6 mb-3 text-2xl font-heading font-bold leading-tight" {...props} />,
          h2: (props: any) => <h2 className="mt-5 mb-2 text-xl font-heading font-semibold leading-tight" {...props} />,
          h3: (props: any) => <h3 className="mt-4 mb-2 text-lg font-heading font-medium leading-tight" {...props} />,
          ul: (props: any) => <ul className="list-disc ml-6 space-y-1.5 leading-relaxed" {...props} />,
          ol: (props: any) => <ol className="list-decimal ml-6 space-y-1.5 leading-relaxed" {...props} />,
          p: (props: any) => <p className="my-3 leading-relaxed" {...props} />,
          a: (props: any) => <a className="underline text-blue-600 hover:text-blue-700 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
          code: ({ className, children, ...props }: any) => (
            <code className={`px-1.5 py-0.5 rounded bg-muted text-sm font-mono ${className || ''}`} {...props}>{children}</code>
          ),
          table: (props: any) => <table className="table-auto w-full border-collapse" {...props} />,
          th: (props: any) => <th className="px-3 py-2 text-left border-b font-medium" {...props} />,
          td: (props: any) => <td className="px-3 py-2 align-top border-b" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}






