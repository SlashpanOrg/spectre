import { defaultTheme, Theme } from '../types/theme.js'

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'function' | 'type' | 'plain'
  value: string
}

const LANGUAGE_KEYWORDS: Record<string, Set<string>> = {
  typescript: new Set([
    'const',
    'let',
    'var',
    'function',
    'async',
    'await',
    'return',
    'if',
    'else',
    'for',
    'while',
    'class',
    'interface',
    'type',
    'enum',
    'import',
    'export',
    'from',
    'default',
    'new',
    'this',
    'extends',
    'implements',
    'private',
    'public',
    'protected',
    'static',
    'readonly',
    'typeof',
    'instanceof',
    'switch',
    'case',
    'break',
    'continue',
    'try',
    'catch',
    'finally',
    'throw',
    'yield',
    'void',
    'null',
    'undefined',
    'true',
    'false',
    'as',
    'in',
    'of',
    'declare',
    'namespace',
  ]),
  javascript: new Set([
    'const',
    'let',
    'var',
    'function',
    'async',
    'await',
    'return',
    'if',
    'else',
    'for',
    'while',
    'class',
    'import',
    'export',
    'from',
    'default',
    'new',
    'this',
    'extends',
    'switch',
    'case',
    'break',
    'continue',
    'try',
    'catch',
    'finally',
    'throw',
    'yield',
    'void',
    'null',
    'undefined',
    'true',
    'false',
    'of',
  ]),
  python: new Set([
    'def',
    'class',
    'import',
    'from',
    'as',
    'return',
    'if',
    'elif',
    'else',
    'for',
    'while',
    'try',
    'except',
    'finally',
    'raise',
    'with',
    'yield',
    'lambda',
    'pass',
    'break',
    'continue',
    'and',
    'or',
    'not',
    'is',
    'in',
    'True',
    'False',
    'None',
    'async',
    'await',
    'self',
  ]),
  rust: new Set([
    'fn',
    'let',
    'mut',
    'const',
    'static',
    'struct',
    'enum',
    'impl',
    'trait',
    'pub',
    'priv',
    'use',
    'mod',
    'crate',
    'self',
    'super',
    'return',
    'if',
    'else',
    'for',
    'while',
    'loop',
    'match',
    'break',
    'continue',
    'async',
    'await',
    'move',
    'ref',
    'where',
    'type',
    'dyn',
    'true',
    'false',
    'Some',
    'None',
    'Ok',
    'Err',
  ]),
  go: new Set([
    'package',
    'import',
    'func',
    'var',
    'const',
    'type',
    'struct',
    'interface',
    'map',
    'chan',
    'return',
    'if',
    'else',
    'for',
    'range',
    'switch',
    'case',
    'break',
    'continue',
    'defer',
    'go',
    'select',
    'fallthrough',
    'true',
    'false',
    'nil',
    'make',
    'append',
  ]),
  java: new Set([
    'public',
    'private',
    'protected',
    'static',
    'final',
    'abstract',
    'class',
    'interface',
    'extends',
    'implements',
    'import',
    'package',
    'return',
    'if',
    'else',
    'for',
    'while',
    'do',
    'switch',
    'case',
    'break',
    'continue',
    'try',
    'catch',
    'finally',
    'throw',
    'throws',
    'new',
    'this',
    'super',
    'void',
    'int',
    'long',
    'double',
    'float',
    'boolean',
    'char',
    'byte',
    'true',
    'false',
    'null',
    'instanceof',
    'synchronized',
    'volatile',
    'transient',
  ]),
}

function tokenize(code: string, language: string): Token[] {
  const keywords = LANGUAGE_KEYWORDS[language] || LANGUAGE_KEYWORDS.typescript
  const tokens: Token[] = []
  let i = 0

  while (i < code.length) {
    if (code[i] === '/' && code[i + 1] === '/') {
      let comment = ''
      while (i < code.length && code[i] !== '\n') {
        comment += code[i]
        i++
      }
      tokens.push({ type: 'comment', value: comment })
    } else if (code[i] === '/' && code[i + 1] === '*') {
      let comment = '/*'
      i += 2
      while (i < code.length && !(code[i - 1] === '*' && code[i] === '/')) {
        comment += code[i]
        i++
      }
      comment += code[i] || ''
      i++
      tokens.push({ type: 'comment', value: comment })
    } else if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i]
      let str = quote
      i++
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') {
          str += code[i] + (code[i + 1] || '')
          i += 2
        } else {
          str += code[i]
          i++
        }
      }
      str += code[i] || ''
      i++
      tokens.push({ type: 'string', value: str })
    } else if (/\d/.test(code[i]) && (i === 0 || !/\w/.test(code[i - 1]))) {
      let num = ''
      while (i < code.length && /[\d.xXa-fA-FeEbBoO_]/.test(code[i])) {
        num += code[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
    } else if (/[a-zA-Z_$]/.test(code[i])) {
      let word = ''
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        word += code[i]
        i++
      }
      if (keywords.has(word)) {
        tokens.push({ type: 'keyword', value: word })
      } else if (i < code.length && code[i] === '(') {
        tokens.push({ type: 'function', value: word })
      } else if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        tokens.push({ type: 'type', value: word })
      } else {
        tokens.push({ type: 'plain', value: word })
      }
    } else if (/[=<>!+\-*/%&|^~?:]/.test(code[i])) {
      let op = ''
      while (i < code.length && /[=<>!+\-*/%&|^~?:]/.test(code[i])) {
        op += code[i]
        i++
      }
      tokens.push({ type: 'operator', value: op })
    } else {
      tokens.push({ type: 'plain', value: code[i] })
      i++
    }
  }

  return tokens
}

function tokenToAnsi(token: Token, _theme: Theme = defaultTheme): string {
  switch (token.type) {
    case 'keyword':
      return `\x1b[38;5;165m${token.value}\x1b[0m`
    case 'string':
      return `\x1b[38;5;114m${token.value}\x1b[0m`
    case 'comment':
      return `\x1b[38;5;245m${token.value}\x1b[0m`
    case 'number':
      return `\x1b[38;5;214m${token.value}\x1b[0m`
    case 'operator':
      return `\x1b[38;5;135m${token.value}\x1b[0m`
    case 'function':
      return `\x1b[38;5;75m${token.value}\x1b[0m`
    case 'type':
      return `\x1b[38;5;81m${token.value}\x1b[0m`
    default:
      return token.value
  }
}

export function highlightCode(
  code: string,
  language: string = 'typescript',
  theme: Theme = defaultTheme,
): string {
  const tokens = tokenize(code, language)
  return tokens.map((t) => tokenToAnsi(t, theme)).join('')
}

export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    kt: 'java',
    rb: 'ruby',
    sh: 'bash',
    bash: 'bash',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    html: 'html',
    css: 'css',
    sql: 'sql',
  }
  return map[ext] || 'typescript'
}
