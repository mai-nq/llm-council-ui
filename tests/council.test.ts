import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateConversationTitle } from '@/lib/council'
import type { Settings } from '@/lib/types'

// Mock the openrouter module
vi.mock('@/lib/openrouter', () => ({
  callModel: vi.fn(),
  callModelsParallel: vi.fn(),
}))

import { callModel } from '@/lib/openrouter'

const mockCallModel = vi.mocked(callModel)

describe('generateConversationTitle', () => {
  const mockSettings: Settings = {
    models: [],
    chairmanModel: 'anthropic/claude-sonnet-4.6',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a valid title from LLM response', async () => {
    mockCallModel.mockResolvedValueOnce('Understanding AI Consciousness')

    const title = await generateConversationTitle(
      'What is consciousness and can AI have it?',
      'Consciousness is a complex phenomenon involving subjective experience...',
      mockSettings
    )

    expect(title).toBe('Understanding AI Consciousness')
    expect(mockCallModel).toHaveBeenCalledOnce()
    expect(mockCallModel).toHaveBeenCalledWith(
      'anthropic/claude-sonnet-4.6',
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('What is consciousness'),
        }),
      ])
    )
  })

  it('cleans up title with quotes', async () => {
    mockCallModel.mockResolvedValueOnce('"Exploring the Nature of AI Consciousness"')

    const title = await generateConversationTitle(
      'What is consciousness?',
      'Consciousness involves...',
      mockSettings
    )

    expect(title).toBe('Exploring the Nature of AI Consciousness')
  })

  it('removes "Title:" prefix from response', async () => {
    mockCallModel.mockResolvedValueOnce('Title: Deep Learning Fundamentals')

    const title = await generateConversationTitle(
      'Explain deep learning',
      'Deep learning is a subset of machine learning...',
      mockSettings
    )

    expect(title).toBe('Deep Learning Fundamentals')
  })

  it('truncates very long titles', async () => {
    const longTitle = 'A'.repeat(150)
    mockCallModel.mockResolvedValueOnce(longTitle)

    const title = await generateConversationTitle(
      'Test question',
      'Test response',
      mockSettings
    )

    expect(title.length).toBeLessThanOrEqual(100)
    expect(title.endsWith('...')).toBe(true)
  })

  it('falls back to truncated question on LLM failure', async () => {
    mockCallModel.mockRejectedValueOnce(new Error('API Error'))

    const title = await generateConversationTitle(
      'What is the meaning of life and the universe and everything else that matters?',
      'The answer is 42...',
      mockSettings
    )

    expect(title.length).toBeLessThanOrEqual(50)
    expect(mockCallModel).toHaveBeenCalledOnce()
  })

  it('falls back to truncated question when title is too short', async () => {
    mockCallModel.mockResolvedValueOnce('Hi')

    const title = await generateConversationTitle(
      'What is the meaning of life?',
      'The meaning of life...',
      mockSettings
    )

    // Should fallback to truncated question
    expect(title).toContain('What is the meaning')
  })

  it('includes first 200 chars of synthesis in prompt', async () => {
    const longSynthesis = 'A'.repeat(500)
    mockCallModel.mockResolvedValueOnce('Valid Title Here')

    await generateConversationTitle('Question', longSynthesis, mockSettings)

    // Verify the call was made and content contains exactly 200 As (not 500)
    expect(mockCallModel).toHaveBeenCalledOnce()
    const callArgs = mockCallModel.mock.calls[0]
    const content = callArgs[1][0].content as string

    // Should contain SUMMARY tag with exactly 200 A's (security: XML-escaped format)
    expect(content).toContain('<SUMMARY>' + 'A'.repeat(200) + '</SUMMARY>')
    // Should NOT contain 201 or more A's in a row
    expect(content).not.toContain('A'.repeat(201))
  })

  it('uses chairman model from settings', async () => {
    const customSettings: Settings = {
      models: [],
      chairmanModel: 'openai/gpt-5.4-pro',
    }
    mockCallModel.mockResolvedValueOnce('Test Title')

    await generateConversationTitle('Question', 'Answer', customSettings)

    expect(mockCallModel).toHaveBeenCalledWith(
      'openai/gpt-5.4-pro',
      expect.any(Array)
    )
  })
})
