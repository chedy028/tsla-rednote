import { Component, PropsWithChildren } from 'react'
import { StoreProvider } from './store'
import './app.scss'

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    console.log('TSLA Red Note Mini Program Started')
  }

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return <StoreProvider>{this.props.children}</StoreProvider>
  }
}

export default App
