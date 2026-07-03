import React, { useEffect, useState } from 'react';
import { axiosClient as axios } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { hasRole } from '../../../../mtse-shared/src/auth';
import { useSnackbar } from '../../components/common/Snackbar';
import { StorefrontPreview } from './StorefrontPreview';
import {
  THEME_PRESETS,
  getThemePreset,
  getSectionDefinition,
  mergeStorefrontConfig,
  type StorefrontConfig,
  type SectionInstance,
} from '../../../../mtse-shared/src/storefront';

type EditorTab = 'template' | 'branding' | 'sections';

export const StoreCustomizer: React.FC = () => {
  const { user } = useAdminAuth();
  const { showSnackbar } = useSnackbar();
  const isPlatformAdmin = hasRole(user, 'platform_admin');

  const tenantId = user?.tenantId;
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState<EditorTab>('template');

  useEffect(() => {
    if (!tenantId || isPlatformAdmin) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get(`/tenants/${tenantId}`);
        const merged = mergeStorefrontConfig(data?.settings?.storefront);
        // Seed branding from the tenant record when the config is fresh.
        merged.branding.name = data?.settings?.storefront?.branding?.name || data?.name || merged.branding.name;
        merged.branding.logoUrl = merged.branding.logoUrl || data?.logoUrl || '';
        merged.branding.bannerUrl = merged.branding.bannerUrl || data?.bannerUrl || '';
        setConfig(merged);
      } catch (err) {
        console.error('Failed to load storefront config', err);
        showSnackbar('Could not load your storefront settings.', 'error');
        setConfig(mergeStorefrontConfig(null));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, isPlatformAdmin]);

  // --- Guardrails: superadmins audit but cannot edit store content ---
  if (isPlatformAdmin) {
    return (
      <Centered>
        <div style={{ fontSize: '3rem' }}>🔒</div>
        <h2 style={{ fontWeight: 800, margin: '1rem 0 0.5rem' }}>Storefront editing is owner-only</h2>
        <p style={{ color: '#666', maxWidth: 460, textAlign: 'center' }}>
          As a platform admin you can provision and audit stores, but the look &amp; content of a
          storefront is managed by its owner. Open <strong>All Stores</strong> to review tenants.
        </p>
      </Centered>
    );
  }

  if (!tenantId) {
    return (
      <Centered>
        <div style={{ fontSize: '3rem' }}>🏪</div>
        <h2 style={{ fontWeight: 800, margin: '1rem 0 0.5rem' }}>No store to customize yet</h2>
        <p style={{ color: '#666', maxWidth: 460, textAlign: 'center' }}>
          Create your store first, then come back to design your storefront.
        </p>
      </Centered>
    );
  }

  if (isLoading || !config) {
    return <Centered>⚙️ Loading your storefront…</Centered>;
  }

  // --- Mutators ---
  const update = (next: StorefrontConfig) => setConfig({ ...next });

  const setTemplate = (templateId: string) => {
    // Switching template only swaps the theme; sections & content are preserved.
    const preset = getThemePreset(templateId);
    update({
      ...config,
      templateId,
      branding: {
        ...config.branding,
        // Reset accent to the new preset's primary only if it matched the old one.
        accentColor:
          config.branding.accentColor === getThemePreset(config.templateId).tokens.primary
            ? preset.tokens.primary
            : config.branding.accentColor,
      },
    });
  };

  const setBranding = (patch: Partial<StorefrontConfig['branding']>) =>
    update({ ...config, branding: { ...config.branding, ...patch } });

  const toggleSection = (type: SectionInstance['type']) => {
    const def = getSectionDefinition(type);
    if (def?.locked) return; // locked sections cannot be hidden
    update({
      ...config,
      sections: config.sections.map((s) => (s.type === type ? { ...s, enabled: !s.enabled } : s)),
    });
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= config.sections.length) return;
    const next = [...config.sections];
    [next[index], next[target]] = [next[target], next[index]];
    update({ ...config, sections: next });
  };

  const setSectionProp = (type: SectionInstance['type'], key: string, value: unknown) =>
    update({
      ...config,
      sections: config.sections.map((s) =>
        s.type === type ? { ...s, props: { ...s.props, [key]: value } } : s,
      ),
    });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`/tenants/${tenantId}`, {
        name: config.branding.name,
        logoUrl: config.branding.logoUrl,
        bannerUrl: config.branding.bannerUrl,
        settings: { storefront: config },
      });
      showSnackbar('Storefront published successfully!', 'success');
    } catch (err) {
      console.error('Failed to save storefront config', err);
      showSnackbar('Failed to publish changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Toolbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid #eee', background: '#fff' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Customize Storefront</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>
            {config.branding.name} · template: {getThemePreset(config.templateId).name}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{ background: '#000', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: 700, cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
        >
          {isSaving ? 'Publishing…' : 'Publish'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', flex: 1, minHeight: 0 }}>
        {/* Editor panel */}
        <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', background: '#fafafa' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #eee', background: '#fff' }}>
            <TabBtn active={tab === 'template'} onClick={() => setTab('template')} label="Template" />
            <TabBtn active={tab === 'branding'} onClick={() => setTab('branding')} label="Branding" />
            <TabBtn active={tab === 'sections'} onClick={() => setTab('sections')} label="Sections" />
          </div>

          <div style={{ padding: '1.5rem' }}>
            {tab === 'template' && <TemplateEditor config={config} onPick={setTemplate} />}
            {tab === 'branding' && <BrandingEditor config={config} onChange={setBranding} />}
            {tab === 'sections' && (
              <SectionsEditor
                config={config}
                onToggle={toggleSection}
                onMove={moveSection}
                onProp={setSectionProp}
              />
            )}
          </div>
        </div>

        {/* Live preview */}
        <div style={{ padding: '2rem', overflowY: 'auto', background: '#f0f0f3' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', minHeight: '100%' }}>
            <StorefrontPreview config={config} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Template editor ──────────────────────────────────────────────────────────

const TemplateEditor: React.FC<{ config: StorefrontConfig; onPick: (id: string) => void }> = ({ config, onPick }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
      Pick a base template. Your content and section layout stay the same — only the look changes.
    </p>
    {THEME_PRESETS.map((preset) => {
      const active = preset.id === config.templateId;
      const t = preset.tokens;
      return (
        <button
          key={preset.id}
          onClick={() => onPick(preset.id)}
          style={{ textAlign: 'left', border: active ? '2px solid #000' : '1px solid #ddd', borderRadius: '12px', padding: '1rem', background: '#fff', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {[t.background, t.surface, t.primary, t.muted].map((c) => (
              <span key={c} style={{ width: 24, height: 24, borderRadius: t.buttonRadius === '9999px' ? '50%' : '4px', background: c, border: '1px solid #0001' }} />
            ))}
          </div>
          <strong style={{ display: 'block', fontFamily: t.headingFont }}>{preset.name}</strong>
          <span style={{ fontSize: '0.8rem', color: '#777' }}>{preset.description}</span>
          {active && <span style={{ display: 'inline-block', marginTop: 8, fontSize: '0.7rem', fontWeight: 700, color: '#000' }}>✓ ACTIVE</span>}
        </button>
      );
    })}
  </div>
);

// ─── Branding editor ──────────────────────────────────────────────────────────

const BrandingEditor: React.FC<{
  config: StorefrontConfig;
  onChange: (patch: Partial<StorefrontConfig['branding']>) => void;
}> = ({ config, onChange }) => {
  const preset = getThemePreset(config.templateId);
  const b = config.branding;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Field label="Store name">
        <input value={b.name} onChange={(e) => onChange({ name: e.target.value })} style={inputStyle} maxLength={60} />
      </Field>
      <Field label="Tagline">
        <input value={b.tagline} onChange={(e) => onChange({ tagline: e.target.value })} style={inputStyle} maxLength={100} placeholder="A short brand line" />
      </Field>
      <Field label="Logo URL">
        <input value={b.logoUrl} onChange={(e) => onChange({ logoUrl: e.target.value })} style={inputStyle} placeholder="https://…" />
      </Field>
      <Field label="Banner URL">
        <input value={b.bannerUrl} onChange={(e) => onChange({ bannerUrl: e.target.value })} style={inputStyle} placeholder="https://…" />
      </Field>
      <Field label="Accent color">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {preset.accentPalette.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ accentColor: c })}
              title={c}
              style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: b.accentColor === c ? '3px solid #000' : '1px solid #ccc' }}
            />
          ))}
          <input type="color" value={b.accentColor} onChange={(e) => onChange({ accentColor: e.target.value })} style={{ width: 36, height: 28, padding: 0, border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }} />
        </div>
      </Field>
    </div>
  );
};

// ─── Sections editor ──────────────────────────────────────────────────────────

const SectionsEditor: React.FC<{
  config: StorefrontConfig;
  onToggle: (type: SectionInstance['type']) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onProp: (type: SectionInstance['type'], key: string, value: unknown) => void;
}> = ({ config, onToggle, onMove, onProp }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
        Toggle, reorder and edit sections. Locked sections (🔒) always appear.
      </p>
      {config.sections.map((section, index) => {
        const def = getSectionDefinition(section.type);
        if (!def) return null;
        const open = expanded === section.type;
        return (
          <div key={section.type} style={{ border: '1px solid #e2e2e2', borderRadius: '10px', background: '#fff', opacity: section.enabled ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
              <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{def.icon}</span>
              <button onClick={() => setExpanded(open ? null : section.type)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <strong style={{ fontSize: '0.9rem' }}>{def.label}</strong>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>{def.locked ? '🔒 Always on' : section.enabled ? 'Visible' : 'Hidden'}</div>
              </button>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => onMove(index, -1)} disabled={index === 0} style={arrowStyle} title="Move up">▲</button>
                <button onClick={() => onMove(index, 1)} disabled={index === config.sections.length - 1} style={arrowStyle} title="Move down">▼</button>
              </div>

              {!def.locked && (
                <label style={{ position: 'relative', display: 'inline-block', width: 38, height: 22 }}>
                  <input type="checkbox" checked={section.enabled} onChange={() => onToggle(section.type)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', inset: 0, background: section.enabled ? '#000' : '#ccc', borderRadius: 22, transition: '0.2s' }}>
                    <span style={{ position: 'absolute', height: 16, width: 16, left: section.enabled ? 19 : 3, top: 3, background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
                  </span>
                </label>
              )}
            </div>

            {open && def.fields.length > 0 && (
              <div style={{ borderTop: '1px solid #eee', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {def.fields.map((f) => {
                  const value = section.props[f.key];
                  if (f.type === 'boolean') {
                    return (
                      <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={!!value} onChange={(e) => onProp(section.type, f.key, e.target.checked)} />
                        {f.label}
                      </label>
                    );
                  }
                  return (
                    <Field key={f.key} label={f.label}>
                      {f.type === 'textarea' ? (
                        <textarea value={String(value ?? '')} maxLength={f.maxLength} onChange={(e) => onProp(section.type, f.key, e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
                      ) : (
                        <input value={String(value ?? '')} maxLength={f.maxLength} placeholder={f.placeholder} onChange={(e) => onProp(section.type, f.key, e.target.value)} style={inputStyle} />
                      )}
                    </Field>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Small presentational helpers ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

const arrowStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.6rem',
  color: '#999',
  lineHeight: 1,
  padding: '2px',
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: 'block' }}>
    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#444', marginBottom: 6 }}>{label}</span>
    {children}
  </label>
);

const TabBtn: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    style={{ flex: 1, padding: '14px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: active ? 700 : 500, color: active ? '#000' : '#999', borderBottom: active ? '2px solid #000' : '2px solid transparent' }}
  >
    {label}
  </button>
);

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
    {children}
  </div>
);
