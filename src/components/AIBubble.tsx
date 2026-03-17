/**
 * AI 聊天气泡组件
 * 支持用户消息（右侧）和 AI 回复（左侧）两种样式
 */
import { View, Text } from '@tarojs/components'
import type { ChatMessage } from '../services/ai'
import './AIBubble.scss'

interface AIBubbleProps {
  message: ChatMessage
}

export default function AIBubble({ message }: AIBubbleProps) {
  const isUser = message.role === 'user'
  const timeText = formatTime(message.timestamp)

  return (
    <View className={`ai-bubble ${isUser ? 'ai-bubble--user' : 'ai-bubble--assistant'}`}>
      {!isUser && (
        <View className='ai-bubble__avatar'>
          <Text className='ai-bubble__avatar-text'>AI</Text>
        </View>
      )}

      <View className='ai-bubble__content-wrapper'>
        <View className={`ai-bubble__content ${isUser ? 'ai-bubble__content--user' : 'ai-bubble__content--assistant'}`}>
          {(() => {
            const lines = message.content.split('\n')
            return lines.map((line, idx) => (
              <Text
                key={`${message.id}_line_${idx}`}
                className={`ai-bubble__text ${line === '' ? 'ai-bubble__text--empty' : ''}`}
              >
                {line}
                {idx < lines.length - 1 ? '\n' : ''}
              </Text>
            ))
          })()}
        </View>
        <Text className='ai-bubble__time'>{timeText}</Text>
      </View>

      {isUser && (
        <View className='ai-bubble__avatar ai-bubble__avatar--user'>
          <Text className='ai-bubble__avatar-text'>我</Text>
        </View>
      )}
    </View>
  )
}

/**
 * AI 思考中的加载动画气泡
 */
export function AIBubbleLoading() {
  return (
    <View className='ai-bubble ai-bubble--assistant'>
      <View className='ai-bubble__avatar'>
        <Text className='ai-bubble__avatar-text'>AI</Text>
      </View>
      <View className='ai-bubble__content-wrapper'>
        <View className='ai-bubble__content ai-bubble__content--assistant ai-bubble__content--loading'>
          <View className='ai-bubble__loading-dots'>
            <View className='ai-bubble__dot ai-bubble__dot--1' />
            <View className='ai-bubble__dot ai-bubble__dot--2' />
            <View className='ai-bubble__dot ai-bubble__dot--3' />
          </View>
          <Text className='ai-bubble__loading-text'>AI 正在分析中...</Text>
        </View>
      </View>
    </View>
  )
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
