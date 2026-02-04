"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
    content: string
}

export function ArticleMarkdown({ content }: Props) {
    return (
        <article className="kb-article">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Encabezados con color azul de la empresa
                    h1: ({ children }) => (
                        <h1 className="text-3xl font-bold text-primary mb-6 mt-8 first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold text-primary mb-4 mt-8 border-b border-border pb-2">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-xl font-semibold text-primary/90 mb-3 mt-6">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-lg font-medium text-primary/80 mb-2 mt-4">
                            {children}
                        </h4>
                    ),
                    // Párrafos
                    p: ({ children }) => (
                        <p className="text-muted-foreground leading-7 mb-4">
                            {children}
                        </p>
                    ),
                    // Texto fuerte/negrita
                    strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">
                            {children}
                        </strong>
                    ),
                    // Listas
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-4 space-y-2 text-muted-foreground">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-4 space-y-2 text-muted-foreground">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-7">
                            {children}
                        </li>
                    ),
                    // Enlaces
                    a: ({ href, children }) => (
                        <a 
                            href={href} 
                            className="text-primary underline hover:text-primary/80 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),
                    // Tablas con estilo elegante
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-border">
                            <table className="w-full text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-primary/10 border-b border-border">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="divide-y divide-border">
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr className="hover:bg-muted/50 transition-colors">
                            {children}
                        </tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-3 text-left font-semibold text-primary">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-3 text-muted-foreground">
                            {children}
                        </td>
                    ),
                    // Bloques de código
                    code: ({ className, children }) => {
                        const isInline = !className
                        if (isInline) {
                            return (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                                    {children}
                                </code>
                            )
                        }
                        return (
                            <code className="block bg-muted p-4 rounded-lg overflow-x-auto font-mono text-sm text-foreground">
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => (
                        <pre className="bg-muted rounded-lg my-4 overflow-hidden">
                            {children}
                        </pre>
                    ),
                    // Citas en bloque
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-orange-500 pl-4 py-2 my-4 bg-orange-500/5 rounded-r-lg italic text-muted-foreground">
                            {children}
                        </blockquote>
                    ),
                    // Regla horizontal
                    hr: () => (
                        <hr className="my-8 border-border" />
                    ),
                    // Imágenes
                    img: ({ src, alt }) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                            src={src} 
                            alt={alt || ''} 
                            className="rounded-lg max-w-full h-auto my-4 shadow-md"
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </article>
    )
}
