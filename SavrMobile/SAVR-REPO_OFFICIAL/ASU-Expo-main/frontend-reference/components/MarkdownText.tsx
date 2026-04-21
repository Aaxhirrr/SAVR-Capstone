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
    <div className="w-full max-w-[68ch] break-words [overflow-wrap:anywhere] text-sm sm:text-[15px] leading-[1.65] font-body text-inherit">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: (props: any) => (
            <h1
              className="mt-7 mb-3 text-xl sm:text-2xl font-heading font-semibold tracking-tight leading-tight text-inherit"
              {...props}
            />
          ),
          h2: (props: any) => (
            <h2
              className="mt-6 mb-3 text-lg sm:text-xl font-heading font-semibold tracking-tight leading-tight text-inherit"
              {...props}
            />
          ),
          h3: (props: any) => (
            <h3
              className="mt-5 mb-2 text-base sm:text-lg font-heading font-medium leading-tight text-inherit"
              {...props}
            />
          ),
          p: (props: any) => (
            <p className="my-3 sm:my-4 leading-[1.65] text-inherit" {...props} />
          ),
          ul: (props: any) => (
            <ul
              className="my-3 sm:my-4 list-disc pl-5 space-y-2 marker:text-muted-foreground [&_ul]:mt-2 [&_ul]:mb-0 [&_ul]:list-[circle] [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:mb-0 [&_ol]:pl-5"
              {...props}
            />
          ),
          ol: (props: any) => (
            <ol
              className="my-3 sm:my-4 list-decimal pl-5 space-y-2 marker:text-muted-foreground [&_ul]:mt-2 [&_ul]:mb-0 [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:mb-0 [&_ol]:pl-5"
              {...props}
            />
          ),
          li: (props: any) => <li className="pl-1 leading-[1.65]" {...props} />,
          a: (props: any) => (
            <a
              className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80 break-all"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: (props: any) => (
            <blockquote
              className="my-4 border-l-2 border-primary/40 pl-4 italic text-muted-foreground"
              {...props}
            />
          ),
          pre: (props: any) => (
            <pre
              className="my-4 overflow-x-auto rounded-xl border border-border/80 bg-muted/70 px-3 py-3 sm:px-4 sm:py-4"
              {...props}
            />
          ),
          code: ({ inline, className, children, ...props }: any) =>
            inline ? (
              <code
                className="rounded-md bg-muted px-1.5 py-0.5 text-[0.9em] font-mono text-inherit"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={`font-mono text-[0.92em] leading-[1.6] ${className || ''}`} {...props}>
                {children}
              </code>
            ),
          table: (props: any) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: (props: any) => (
            <th className="border-b border-border/80 px-3 py-2 text-left font-medium" {...props} />
          ),
          td: (props: any) => (
            <td className="border-b border-border/70 px-3 py-2 align-top" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
