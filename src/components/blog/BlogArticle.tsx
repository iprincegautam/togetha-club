import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { formatInr, type BatchPricingRow } from '@/lib/batch-pricing'
import type { BlogPost } from '@/types/blog'

type Props = {
  post: BlogPost
  pricing?: BatchPricingRow[]
  pricingAsOf?: string
}

export default function BlogArticle({ post, pricing, pricingAsOf }: Props) {
  return (
    <article className="blog-article">
      <header className="blog-article-head">
        <p className="blog-eyebrow">✦ Togetha Journal</p>
        <h1 className="blog-title">{post.title}</h1>
        <p className="blog-meta">
          By {post.author} · {formatDate(post.publishedAt)}
          {post.updatedAt !== post.publishedAt && (
            <> · Updated {formatDate(post.updatedAt)}</>
          )}
        </p>
        <p className="blog-excerpt">{post.excerpt}</p>
      </header>

      <div className="blog-body">
        {post.sections.map((section, index) => {
          switch (section.type) {
            case 'h2':
              return (
                <h2 key={index} className="blog-h2">
                  {section.text}
                </h2>
              )
            case 'h3':
              return (
                <h3 key={index} className="blog-h3">
                  {section.text}
                </h3>
              )
            case 'p':
              return (
                <p key={index} className="blog-p">
                  {section.text}
                </p>
              )
            case 'ul':
              return (
                <ul key={index} className="blog-ul">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )
            case 'callout':
              return (
                <blockquote key={index} className="blog-callout">
                  {section.text}
                </blockquote>
              )
            case 'table':
              return (
                <figure key={index} className="blog-table-wrap">
                  {section.caption && <figcaption>{section.caption}</figcaption>}
                  <table className="blog-table">
                    <thead>
                      <tr>
                        {section.headers.map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </figure>
              )
            case 'live_pricing':
              return pricing ? (
                <BlogPriceTable key={index} rows={pricing} asOf={pricingAsOf} />
              ) : null
            case 'cta':
              return (
                <div key={index} className="blog-cta">
                  <Link href={section.href} className="btn-p blog-cta-primary">
                    {section.label}
                  </Link>
                  {section.secondary && (
                    <Link href={section.secondary.href} className="blog-cta-secondary">
                      {section.secondary.label}
                    </Link>
                  )}
                </div>
              )
            default:
              return null
          }
        })}
      </div>

      {post.faq.length > 0 && (
        <section className="blog-faq" aria-labelledby="blog-faq-title">
          <h2 id="blog-faq-title" className="blog-h2">
            Frequently asked questions
          </h2>
          <dl className="blog-faq-list">
            {post.faq.map((item) => (
              <div key={item.question} className="blog-faq-item">
                <dt>{item.question}</dt>
                <dd>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <nav className="blog-related" aria-label="Related">
        <p className="blog-related-label">Continue exploring</p>
        <ul>
          <li>
            <Link href={ROUTES.match}>Take the compatibility quiz →</Link>
          </li>
          <li>
            <Link href={ROUTES.batches}>View live batches →</Link>
          </li>
          <li>
            <Link href={`${ROUTES.home}#faq`}>Homepage FAQ →</Link>
          </li>
          <li>
            <Link href={ROUTES.blog}>All articles →</Link>
          </li>
        </ul>
      </nav>
    </article>
  )
}

function BlogPriceTable({ rows, asOf }: { rows: BatchPricingRow[]; asOf?: string }) {
  return (
    <figure className="blog-table-wrap blog-pricing-table">
      <figcaption>
        Live batch pricing{asOf ? ` · as of ${asOf}` : ''}. Confirm on batch pages before booking.
      </figcaption>
      <table className="blog-table">
        <thead>
          <tr>
            <th>Edition</th>
            <th>Ages</th>
            <th>Price</th>
            <th>Reserve now</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug}>
              <td>{row.label}</td>
              <td>{row.ageRange}</td>
              <td>{row.price != null ? formatInr(row.price) : 'TBD'}</td>
              <td>
                {row.price != null
                  ? `${formatInr(Math.round((row.price * row.depositPercent) / 100))} (${row.depositPercent}%)`
                  : '—'}
              </td>
              <td>{row.status.replace('_', ' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="blog-pricing-note">
        <Link href={ROUTES.cancellationRefund}>Cancellation & refund policy →</Link>
      </p>
    </figure>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
