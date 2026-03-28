#!/usr/bin/env node

/**
 * Code Generator Script
 *
 * Usage:
 *   npm run generate <type> <Name>
 *
 * Types:
 *   component  — src/components/common/<Name>/<Name>.tsx + test
 *   page       — src/features/<Name>/components/<Name>Page.tsx + barrel
 *   feature    — src/features/<Name>/ (full feature scaffold)
 *   service    — src/services/<Name>Service.ts
 *   hook       — src/hooks/use<Name>.ts + test
 *
 * Examples:
 *   npm run generate component Button
 *   npm run generate feature products
 *   npm run generate page Dashboard
 *   npm run generate service auth
 *   npm run generate hook Cart
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const type = args[0]?.toLowerCase();
const rawName = args[1];

if (!type || !rawName) {
  console.error('Usage: npm run generate <type> <Name>');
  console.error('Types: component | page | feature | service | hook');
  process.exit(1);
}

const PascalName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
const camelName = rawName.charAt(0).toLowerCase() + rawName.slice(1);
const kebabName = rawName.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

const SRC = path.resolve(process.cwd(), 'src');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  📁 Created directory: ${path.relative(process.cwd(), dir)}`);
  }
}

function writeFile(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) {
    console.log(`  ⚠️  Skipped (already exists): ${path.relative(process.cwd(), filePath)}`);
    return;
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✅ Created: ${path.relative(process.cwd(), filePath)}`);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const templates = {
  component(name: string) {
    const dir = path.join(SRC, 'components', 'common', name);
    ensureDir(dir);

    writeFile(
      path.join(dir, `${name}.tsx`),
      `interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}

export function ${name}({ className, children }: ${name}Props) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
`,
    );

    writeFile(
      path.join(dir, `${name}.test.tsx`),
      `import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders children', () => {
    render(<${name}>Hello</${name}>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
`,
    );

    writeFile(path.join(dir, 'index.ts'), `export { ${name} } from './${name}';\n`);
  },

  page(name: string) {
    const pageName = name.endsWith('Page') ? name : `${name}Page`;
    const featureName = camelName.replace(/page$/i, '');
    const dir = path.join(SRC, 'features', featureName, 'components');
    ensureDir(dir);

    writeFile(
      path.join(dir, `${pageName}.tsx`),
      `export function ${pageName}() {
  return (
    <div>
      <h1>${pageName.replaceAll(/([A-Z])/g, ' $1').trim()}</h1>
    </div>
  );
}
`,
    );

    // Ensure feature barrel
    const featureIndex = path.join(SRC, 'features', featureName, 'index.ts');
    if (!fs.existsSync(featureIndex)) {
      writeFile(featureIndex, `export { ${pageName} } from './components/${pageName}';\n`);
    }
  },

  feature(name: string) {
    const dir = path.join(SRC, 'features', camelName);
    const subdirs = ['components', 'hooks', 'services', 'types', 'utils'];

    ensureDir(dir);
    for (const sub of subdirs) {
      ensureDir(path.join(dir, sub));
      writeFile(path.join(dir, sub, '.gitkeep'), '');
    }

    writeFile(
      path.join(dir, 'components', `${PascalName}Page.tsx`),
      `export function ${PascalName}Page() {
  return (
    <div>
      <h1>${PascalName}</h1>
    </div>
  );
}
`,
    );

    writeFile(
      path.join(dir, 'types', `${camelName}.types.ts`),
      `export interface ${PascalName} {
  id: string;
  // TODO: add fields
}
`,
    );

    writeFile(
      path.join(dir, 'services', `${camelName}.service.ts`),
      `import type { ApiService } from 'mtse-shared/api';
import type { ${PascalName} } from '../types/${camelName}.types';

export function create${PascalName}Service(api: ApiService) {
  const BASE = '/${kebabName}';

  return {
    getAll: () => api.get<${PascalName}[]>(BASE),
    getById: (id: string) => api.get<${PascalName}>(\`\${BASE}/\${id}\`),
    create: (data: Partial<${PascalName}>) => api.post<${PascalName}>(BASE, data),
    update: (id: string, data: Partial<${PascalName}>) => api.patch<${PascalName}>(\`\${BASE}/\${id}\`, data),
    remove: (id: string) => api.delete<void>(\`\${BASE}/\${id}\`),
  };
}
`,
    );

    writeFile(
      path.join(dir, 'hooks', `use${PascalName}.ts`),
      `import { useState, useEffect } from 'react';

export function use${PascalName}() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: fetch data
    setLoading(false);
  }, []);

  return { loading };
}
`,
    );

    writeFile(
      path.join(dir, 'index.ts'),
      `export { ${PascalName}Page } from './components/${PascalName}Page';
export { create${PascalName}Service } from './services/${camelName}.service';
export { use${PascalName} } from './hooks/use${PascalName}';
export type { ${PascalName} } from './types/${camelName}.types';
`,
    );
  },

  service(name: string) {
    const dir = path.join(SRC, 'services');
    ensureDir(dir);

    writeFile(
      path.join(dir, `${camelName}.service.ts`),
      `import type { ApiService } from 'mtse-shared/api';

export function create${PascalName}Service(api: ApiService) {
  const BASE = '/${kebabName}';

  return {
    getAll: <T>() => api.get<T[]>(BASE),
    getById: <T>(id: string) => api.get<T>(\`\${BASE}/\${id}\`),
    create: <T>(data: unknown) => api.post<T>(BASE, data),
    update: <T>(id: string, data: unknown) => api.patch<T>(\`\${BASE}/\${id}\`, data),
    remove: (id: string) => api.delete<void>(\`\${BASE}/\${id}\`),
  };
}
`,
    );
  },

  hook(name: string) {
    const hookName = name.startsWith('use') ? name : `use${PascalName}`;
    const dir = path.join(SRC, 'hooks');
    ensureDir(dir);

    writeFile(
      path.join(dir, `${hookName}.ts`),
      `import { useState, useCallback } from 'react';

export function ${hookName}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: implement
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
}
`,
    );

    writeFile(
      path.join(dir, `${hookName}.test.ts`),
      `import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ${hookName} } from './${hookName}';

describe('${hookName}', () => {
  it('initializes with correct defaults', () => {
    const { result } = renderHook(() => ${hookName}());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
`,
    );
  },
};

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

if (!(type in templates)) {
  console.error(`Unknown type: "${type}". Valid types: ${Object.keys(templates).join(', ')}`);
  process.exit(1);
}

console.log(`\n🔧 Generating ${type}: ${rawName}\n`);
templates[type as keyof typeof templates](PascalName);
console.log('\nDone!\n');
