import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Send, Loader2, AlertTriangle, Bot, User } from 'lucide-react'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
}

export function IAPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatMutation = useMutation({
    mutationFn: (mensagem: string) => api.post('/ia/chat', { mensagem }).then((r) => r.data),
    onSuccess: (data) => {
      setMensagens((prev) => [...prev, { role: 'assistant', content: data.resposta }])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    },
    onError: () => {
      setMensagens((prev) => [...prev, { role: 'assistant', content: 'Erro ao processar sua pergunta. Tente novamente.' }])
    },
  })

  const sendMessage = () => {
    if (!input.trim() || chatMutation.isPending) return
    const userMessage = input.trim()
    setMensagens((prev) => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    chatMutation.mutate(userMessage)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const sugestoes = [
    'Qual é o prazo para interpor recurso de apelação?',
    'Como funciona a prescrição em ações trabalhistas?',
    'Quais são os requisitos para tutela de urgência?',
    'Explique os tipos de ação no direito processual civil',
  ]

  return (
    <div className="space-y-6 h-full flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Assistente Jurídico IA
          </h1>
          <p className="text-muted-foreground">Powered by Gemini AI — apoio informativo para advogados</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-yellow-700">
          <strong>Aviso:</strong> este assistente fornece informações jurídicas como apoio. Não substitui consultoria jurídica profissional. Valide sempre com um advogado habilitado.
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mensagens.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-16 h-16 mx-auto mb-4 text-primary/30" />
                <h3 className="font-semibold text-lg mb-2">Como posso ajudar?</h3>
                <p className="text-muted-foreground text-sm mb-6">Faça perguntas sobre direito brasileiro, prazos, procedimentos e jurisprudência.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {sugestoes.map((sugestao) => (
                    <button
                      key={sugestao}
                      onClick={() => setInput(sugestao)}
                      className="text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((mensagem, index) => (
              <div key={index} className={`flex gap-3 ${mensagem.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {mensagem.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${mensagem.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                  {mensagem.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans">{mensagem.content}</pre>
                    </div>
                  ) : (
                    mensagem.content
                  )}
                </div>
                {mensagem.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Faça uma pergunta jurídica..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={chatMutation.isPending}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!input.trim() || chatMutation.isPending} size="icon">
                {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}