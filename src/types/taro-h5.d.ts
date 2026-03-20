/**
 * Type augmentation for Taro H5 mode.
 * Taro's ViewProps and ButtonProps don't include standard HTML accessibility
 * attributes, but they work at runtime in H5 mode since View renders to <div>.
 */
import '@tarojs/components'

declare module '@tarojs/components' {
  interface ViewProps {
    role?: string
    tabIndex?: number
  }

  interface ButtonProps {
    role?: string
    tabIndex?: number
  }
}
