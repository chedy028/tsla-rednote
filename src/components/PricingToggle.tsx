import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './PricingToggle.scss'

interface PricingToggleProps {
  onToggle: (isAnnual: boolean) => void
  defaultAnnual?: boolean
}

export default function PricingToggle({ onToggle, defaultAnnual = true }: PricingToggleProps) {
  const [isAnnual, setIsAnnual] = useState(defaultAnnual)

  useEffect(() => {
    onToggle(isAnnual)
  }, [isAnnual, onToggle])

  const handleToggle = () => {
    setIsAnnual(!isAnnual)
  }

  return (
    <View className='pricing-toggle'>
      <Text className={`toggle-label ${!isAnnual ? 'active' : ''}`}>按月付</Text>
      <View className='toggle-switch' onClick={handleToggle}>
        <View className={`toggle-track ${isAnnual ? 'annual' : 'monthly'}`}>
          <View className='toggle-thumb' />
        </View>
      </View>
      <View className='toggle-annual-wrapper'>
        <Text className={`toggle-label ${isAnnual ? 'active' : ''}`}>按年付</Text>
        {isAnnual && (
          <View className='savings-badge'>
            <Text className='savings-text'>省17%</Text>
          </View>
        )}
      </View>
    </View>
  )
}
