import React, { useState, useEffect } from 'react';
import type { FormConfig, FieldConfig } from '../../../../mtse-shared/src/forms';
import { getDefaultValues, getVisibleFields } from '../../../../mtse-shared/src/forms';

interface DynamicFormProps {
  config: FormConfig;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ config, initialValues, onSubmit, onCancel }) => {
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // Merge defaults with initialValues
    setValues({ ...getDefaultValues(config), ...(initialValues || {}) });
  }, [config, initialValues]);

  const handleChange = (name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const visibleFields = getVisibleFields(config, values);

  const renderField = (field: FieldConfig) => {
    const value = values[field.name];

    const baseStyle = { 
      width: '100%', 
      padding: '10px 12px', 
      border: '1px solid #ddd', 
      borderRadius: '6px', 
      fontSize: '0.95rem',
      backgroundColor: field.disabled ? '#f5f5f5' : 'white',
    };

    switch (field.type as string) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            style={{ ...baseStyle, minHeight: '100px', resize: 'vertical' }}
          />
        );
      case 'select':
        return (
          <select
            name={field.name}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            disabled={field.disabled}
            style={baseStyle}
          >
            <option value="" disabled>Select an option</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={String(opt.value)} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name={field.name}
              checked={!!value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              required={field.required}
              disabled={field.disabled}
            />
            <span style={{ fontSize: '0.9rem' }}>{field.placeholder || ''}</span>
          </label>
        );
      case 'color':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <input
              type="color"
              name={field.name}
              value={(value as string) || '#000000'}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={field.disabled}
              style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
            <code style={{ fontSize: '0.8rem', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
              {(value as string) || '#000000'}
            </code>
          </div>
        );
      default:
        // text, email, number, password, url
        return (
          <input
            type={field.type as string}
            name={field.name}
            value={(value as string | number) || ''}
            onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            min={field.min}
            max={field.max}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.pattern}
            style={baseStyle}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${config.columns || 1}, 1fr)`, 
          gap: '1.5rem' 
        }}
      >
        {visibleFields.map(field => (
          <div 
            key={field.name} 
            style={{ gridColumn: field.colSpan ? `span ${field.colSpan}` : 'auto' }}
          >
            {field.label && (
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>
                {field.label} {field.required && <span style={{ color: '#e91e63' }}>*</span>}
              </label>
            )}
            {renderField(field)}
            {field.helpText && (
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#666' }}>{field.helpText}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            {config.resetLabel || 'Cancel'}
          </button>
        )}
        <button 
          type="submit"
          style={{ flex: 1, padding: '12px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {config.submitLabel || 'Submit'}
        </button>
      </div>
    </form>
  );
};
