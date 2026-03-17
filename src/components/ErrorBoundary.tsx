import { Component, PropsWithChildren } from 'react'
import { View, Text, Button } from '@tarojs/components'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: '32px', textAlign: 'center' }}>
          <Text style={{ fontSize: '18px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
            出错了
          </Text>
          <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '20px' }}>
            {this.state.error?.message || '发生了未知错误，请重试'}
          </Text>
          <Button onClick={this.handleRetry} style={{ backgroundColor: '#00d4aa', color: '#fff' }}>
            重试
          </Button>
        </View>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
