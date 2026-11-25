import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

export class OpenAIService {
  constructor({ apiKey, model = 'gpt-4o-mini' }) {
    this.apiKey = apiKey;
    this.model = model;
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  /**
   * Streams chat completion with real-time sentence boundary detection.
   * Calls onSentence(sentence) as soon as a complete sentence is ready for TTS.
   * Calls onToken(token) for real-time live captions.
   */
  async streamResponse({
    messages,
    systemPrompt,
    tools = null,
    onToken,
    onSentence,
    onComplete,
    onError,
    signal,
  }) {
    if (!this.client) {
      const err = new Error('OpenAI client is not initialized. Please configure OPENAI_API_KEY.');
      logger.error(err.message);
      if (onError) onError(err);
      return;
    }

    try {
      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ];

      const params = {
        model: this.model,
        messages: fullMessages,
        stream: true,
        temperature: 0.6,
        max_tokens: 350, // Keep responses crisp and conversational
      };

      if (tools && tools.length > 0) {
        params.tools = tools;
        params.tool_choice = 'auto';
      }

      const stream = await this.client.chat.completions.create(params, { signal });

      let currentSentenceBuffer = '';
      let fullResponseText = '';
      let toolCallsBuffer = [];

      // Regex matching sentence endings followed by space or end of line
      const sentenceEndRegex = /([.!?\n]+)\s+/;

      for await (const chunk of stream) {
        if (signal?.aborted) {
          logger.voice('OpenAI completion stream aborted due to user interruption');
          break;
        }

        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        // Check if delta is a text token
        if (delta.content) {
          const token = delta.content;
          fullResponseText += token;
          currentSentenceBuffer += token;

          if (onToken) onToken(token);

          // Check if buffer contains a complete sentence
          const match = currentSentenceBuffer.match(sentenceEndRegex);
          if (match) {
            const endIndex = match.index + match[0].length;
            const completeSentence = currentSentenceBuffer.substring(0, endIndex).trim();
            currentSentenceBuffer = currentSentenceBuffer.substring(endIndex);

            if (completeSentence.length > 0 && onSentence) {
              onSentence(completeSentence);
            }
          }
        }

        // Accumulate tool calls if present
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCallsBuffer[tc.index]) {
              toolCallsBuffer[tc.index] = {
                id: tc.id || '',
                type: 'function',
                function: { name: tc.function?.name || '', arguments: '' },
              };
            }
            if (tc.id) toolCallsBuffer[tc.index].id = tc.id;
            if (tc.function?.name) toolCallsBuffer[tc.index].function.name = tc.function.name;
            if (tc.function?.arguments) toolCallsBuffer[tc.index].function.arguments += tc.function.arguments;
          }
        }
      }

      // Flush any remaining text in buffer at the end of the stream
      if (currentSentenceBuffer.trim().length > 0 && onSentence && !signal?.aborted) {
        onSentence(currentSentenceBuffer.trim());
      }

      if (onComplete) {
        onComplete({
          text: fullResponseText,
          toolCalls: toolCallsBuffer.filter(Boolean),
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.voice('OpenAI request was successfully cancelled.');
        return;
      }
      logger.error('Error in OpenAI streamResponse:', err);
      if (onError) onError(err);
    }
  }
}
