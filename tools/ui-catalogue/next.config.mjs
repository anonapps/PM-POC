import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const config = { reactStrictMode: true, devIndicators: false, agentRules: false, experimental: { externalDir: true }, webpack(config) { config.resolve.alias['@'] = path.join(root, 'src'); return config; } };

export default config;
