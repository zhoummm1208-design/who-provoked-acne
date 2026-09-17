import { describe,expect,it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
describe('Privacy Audit',()=>{it('生产源代码不包含第三方业务端点或统计 SDK',()=>{const root=path.resolve('src');const files=fs.readdirSync(root).filter(x=>/\.(ts|tsx)$/.test(x)&&!x.endsWith('.test.ts'));const source=files.map(x=>fs.readFileSync(path.join(root,x),'utf8')).join('\n');expect(source).not.toMatch(/google-analytics|mixpanel|amplitude|sentry|hotjar|clarity|facebook\.com\/tr|fetch\(['"]https?:|axios/i)})})
