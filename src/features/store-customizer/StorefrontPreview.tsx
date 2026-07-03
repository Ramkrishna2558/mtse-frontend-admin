import React from 'react';
import {
  getThemePreset,
  type StorefrontConfig,
  type SectionInstance,
} from '../../../../mtse-shared/src/storefront';

/**
 * A lightweight, non-interactive WYSIWYG of the storefront. It renders the
 * enabled sections top-to-bottom using the active template's theme tokens
 * (with the owner's accent override) so changes in the editor are visible
 * immediately. This is a faithful sketch, not the real storefront.
 */
export const StorefrontPreview: React.FC<{ config: StorefrontConfig }> = ({ config }) => {
  const preset = getThemePreset(config.templateId);
  const t = preset.tokens;
  const accent = config.branding.accentColor || t.primary;

  const frame: React.CSSProperties = {
    background: t.background,
    color: t.onBackground,
    fontFamily: t.bodyFont,
    border: `1px solid ${t.outline}`,
    borderRadius: '12px',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={frame}>
      {config.sections
        .filter((s) => s.enabled)
        .map((section) => (
          <PreviewSection key={section.type} section={section} accent={accent} tokens={t} branding={config.branding} />
        ))}
    </div>
  );
};

const PreviewSection: React.FC<{
  section: SectionInstance;
  accent: string;
  tokens: ReturnType<typeof getThemePreset>['tokens'];
  branding: StorefrontConfig['branding'];
}> = ({ section, accent, tokens: t, branding }) => {
  const p = section.props as Record<string, string>;
  const heading: React.CSSProperties = { fontFamily: t.headingFont, color: t.onBackground };
  const button: React.CSSProperties = {
    background: accent,
    color: t.onPrimary,
    border: 'none',
    borderRadius: t.buttonRadius,
    padding: '8px 18px',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'default',
  };

  switch (section.type) {
    case 'header':
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${t.outline}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="logo" style={{ height: '22px', width: '22px', objectFit: 'cover', borderRadius: t.radius }} />
            ) : (
              <div style={{ height: '22px', width: '22px', background: accent, borderRadius: t.radius }} />
            )}
            <strong style={{ ...heading, fontSize: '0.95rem' }}>{branding.name || 'My Store'}</strong>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
            <span>Shop</span>
            <span>About</span>
            {p.showSearch ? <span>⌕</span> : null}
            {p.showWishlist ? <span>♡</span> : null}
            <span>🛍</span>
          </div>
        </div>
      );

    case 'hero':
      return (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: p.image ? `url(${p.image}) center/cover` : t.surface,
            borderBottom: `1px solid ${t.outline}`,
          }}
        >
          <h2 style={{ ...heading, fontSize: '1.8rem', margin: '0 0 8px' }}>{p.heading}</h2>
          <p style={{ color: t.muted, margin: '0 0 16px', fontSize: '0.85rem' }}>{p.subheading}</p>
          {p.ctaLabel ? <button style={button}>{p.ctaLabel}</button> : null}
        </div>
      );

    case 'promo-banner':
      return (
        <div style={{ background: accent, color: t.onPrimary, padding: '10px', textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
          {p.text}
        </div>
      );

    case 'featured-products':
      return (
        <div style={{ padding: '24px' }}>
          <h3 style={{ ...heading, fontSize: '1.1rem', margin: '0 0 14px' }}>{p.heading}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div style={{ aspectRatio: '3/4', background: t.surface, border: `1px solid ${t.outline}`, borderRadius: t.radius }} />
                <div style={{ fontSize: '0.7rem', marginTop: '6px' }}>Product {i + 1}</div>
                <div style={{ fontSize: '0.7rem', color: t.muted }}>₹—</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'category-grid':
      return (
        <div style={{ padding: '24px' }}>
          <h3 style={{ ...heading, fontSize: '1.1rem', margin: '0 0 14px' }}>{p.heading}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {['Apparel', 'Accessories', 'New In'].map((c) => (
              <div key={c} style={{ height: '70px', background: t.surface, border: `1px solid ${t.outline}`, borderRadius: t.radius, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                {c}
              </div>
            ))}
          </div>
        </div>
      );

    case 'newsletter':
      return (
        <div style={{ padding: '32px 24px', textAlign: 'center', background: t.surface, borderTop: `1px solid ${t.outline}` }}>
          <h3 style={{ ...heading, fontSize: '1.1rem', margin: '0 0 6px' }}>{p.heading}</h3>
          <p style={{ color: t.muted, fontSize: '0.8rem', margin: '0 0 14px' }}>{p.subheading}</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <div style={{ width: '180px', height: '32px', background: t.background, border: `1px solid ${t.outline}`, borderRadius: t.buttonRadius }} />
            <button style={button}>Subscribe</button>
          </div>
        </div>
      );

    case 'footer':
      return (
        <div style={{ marginTop: 'auto', padding: '20px 24px', borderTop: `1px solid ${t.outline}`, fontSize: '0.7rem', color: t.muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>{p.tagline || `© ${branding.name || 'My Store'}`}</span>
          <span>Privacy · Terms</span>
        </div>
      );

    default:
      return null;
  }
};
