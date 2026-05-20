import React from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { Select, TextInput } from '@inkjs/ui'
import { addProvider, setActiveProvider } from '../../utils/config.js'
import { logger } from '../../utils/logger.js'

type Step = 'provider' | 'apikey' | 'model' | 'ollama-url' | 'complete'

const PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Ollama (Local LLM)', value: 'ollama' },
]

const OPENAI_MODELS = [
  { label: 'gpt-4o (Recommended)', value: 'gpt-4o' },
  { label: 'gpt-4o-mini (Faster, cheaper)', value: 'gpt-4o-mini' },
]

const ANTHROPIC_MODELS = [
  { label: 'claude-sonnet-4-20250514 (Recommended)', value: 'claude-sonnet-4-20250514' },
  { label: 'claude-haiku (Faster, cheaper)', value: 'claude-haiku-4-20250514' },
]

export function SetupWizard() {
  const { exit } = useApp()
  const [step, setStep] = React.useState<Step>('provider')
  const [selectedProvider, setSelectedProvider] = React.useState('openai')
  const [apiKey, setApiKey] = React.useState('')
  const [selectedModel, setSelectedModel] = React.useState('gpt-4o')
  const [ollamaUrl, setOllamaUrl] = React.useState('http://localhost:11434')
  const [error, setError] = React.useState('')
  const [providerConfirmed, setProviderConfirmed] = React.useState(false)
  const [modelConfirmed, setModelConfirmed] = React.useState(false)

  useInput((_input, key) => {
    if (key.escape) {
      exit()
    }
    if (key.return && step === 'provider' && !providerConfirmed) {
      setProviderConfirmed(true)
      if (selectedProvider === 'ollama') {
        setStep('ollama-url')
      } else {
        setStep('apikey')
      }
    }
    if (key.return && step === 'model' && !modelConfirmed) {
      setModelConfirmed(true)
      handleModelSelect(selectedModel)
    }
  })

  const handleApiKeySubmit = (value: string) => {
    if (!value.trim()) {
      setError('API key is required')
      return
    }
    setApiKey(value.trim())
    setError('')
    setStep('model')
  }

  const handleModelSelect = (value: string) => {
    setSelectedModel(value)
    setError('')

    const provider = {
      name: selectedProvider as 'openai' | 'anthropic' | 'ollama',
      apiKey: selectedProvider === 'ollama' ? undefined : apiKey,
      baseUrl: selectedProvider === 'ollama' ? ollamaUrl : undefined,
      model: value,
      isActive: true,
    }

    addProvider(provider)
    setActiveProvider(provider.name)

    logger.info('Provider configured:', provider.name)
    setStep('complete')
  }

  const handleOllamaUrlSubmit = (value: string) => {
    setOllamaUrl(value.trim() || 'http://localhost:11434')
    setStep('model')
  }

  const models =
    selectedProvider === 'openai'
      ? OPENAI_MODELS
      : selectedProvider === 'anthropic'
        ? ANTHROPIC_MODELS
        : [{ label: 'llama3 (default)', value: 'llama3' }]

  if (step === 'complete') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="green">
          Setup Complete!
        </Text>
        <Text>
          Provider: {selectedProvider} | Model: {selectedModel}
        </Text>
        <Box marginTop={1}>
          <Text dimColor>Run `spectre index` to start indexing your repository.</Text>
        </Box>
        <Text dimColor>Press any key to exit...</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1} width={60}>
      <Text bold color="cyan">
        Spectre Setup Wizard
      </Text>
      <Text dimColor>Press Esc to quit at any time</Text>

      <Box marginTop={1} flexDirection="column">
        {step === 'provider' && (
          <>
            <Text bold>Select AI Provider (press Enter):</Text>
            <Select
              options={PROVIDERS}
              defaultValue={selectedProvider}
              onChange={setSelectedProvider}
            />
          </>
        )}

        {step === 'apikey' && (
          <>
            <Text bold>Enter your {selectedProvider} API key:</Text>
            <Text dimColor>Your key is encrypted and stored locally.</Text>
            {error && (
              <Box marginTop={1}>
                <Text color="red">{error}</Text>
              </Box>
            )}
            <TextInput onSubmit={handleApiKeySubmit} placeholder="sk-..." />
          </>
        )}

        {step === 'ollama-url' && (
          <>
            <Text bold>Enter Ollama URL:</Text>
            <TextInput
              onSubmit={handleOllamaUrlSubmit}
              placeholder="http://localhost:11434"
              defaultValue="http://localhost:11434"
            />
          </>
        )}

        {step === 'model' && (
          <>
            <Text bold>Select Model (press Enter):</Text>
            <Select options={models} defaultValue={selectedModel} onChange={setSelectedModel} />
          </>
        )}
      </Box>
    </Box>
  )
}
