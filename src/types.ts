export interface Post {
  id: number
  title: string
  content: string
  tags: string[]
}

export interface SensitiveWord {
  word: string
  tip: string
}

export interface StyleOption {
  value: string
  label: string
  desc: string
}

export interface Template {
  label: string
  product: string
  features: string
  price: string
  audience: string
}

export interface HistoryItem {
  id: string
  product: string
  posts: Post[]
  createdAt: string
}

export interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error' | 'warning'
}
