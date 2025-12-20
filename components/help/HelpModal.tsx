'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface HelpModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

interface AccordionItemProps {
  readonly title: string
  readonly children: React.ReactNode
  readonly defaultOpen?: boolean
}

function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 nymu-dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 nymu-dark:hover:bg-gray-700 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white nymu-dark:text-white font-primary">
          {title}
        </h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 nymu-dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 nymu-dark:text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-gray-700 dark:text-gray-300 nymu-dark:text-gray-300 font-secondary">
          {children}
        </div>
      )}
    </div>
  )
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 nymu-dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 nymu-dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 nymu-dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white nymu-dark:text-white font-primary">
            Central de Ajuda - Dashboard CRM
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 nymu-dark:hover:text-gray-300 rounded-lg transition-colors"
            aria-label="Fechar ajuda"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-2">
            <AccordionItem title="📊 Filtros" defaultOpen>
              <div className="space-y-4">
                <p>
                  Os <strong>Filtros</strong> permitem que você refine os dados exibidos no dashboard de acordo com critérios específicos.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Filtros Disponíveis:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Data:</strong> Selecione um período específico para análise</li>
                    <li><strong>Temporada:</strong> Filtre por semestre acadêmico (ex: 2025.1, 2024.2)</li>
                    <li><strong>SDR:</strong> Visualize dados de um vendedor específico ou todos</li>
                    <li><strong>Faculdade:</strong> Filtre por instituição de ensino</li>
                    <li><strong>Origem:</strong> Analise leads de uma origem específica</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Como Usar:</h4>
                  <p>
                    Clique no botão <strong>"Filtros"</strong> para abrir o painel de filtros. Configure os critérios desejados e clique em <strong>"Aplicar"</strong>. 
                    O dashboard será atualizado automaticamente com os dados filtrados. Um badge vermelho no botão indica quantos filtros estão ativos.
                  </p>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="⚙️ Configurações">
              <div className="space-y-4">
                <p>
                  As <strong>Configurações</strong> permitem personalizar a visualização e comportamento do dashboard.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Opções Disponíveis:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Layout dos Gráficos:</strong> Escolha entre 1, 2 ou 3 colunas</li>
                    <li><strong>Tema:</strong> Alterne entre temas claro, escuro e personalizados</li>
                    <li><strong>Acessibilidade:</strong> Ajuste tamanho de fonte, espaçamento e contraste</li>
                    <li><strong>Idioma:</strong> Selecione entre Português, Inglês ou Espanhol</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Layout dos Gráficos:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>1 Coluna:</strong> Gráficos em tela cheia, ideal para análise detalhada</li>
                    <li><strong>2 Colunas:</strong> Visualização balanceada, boa para comparações</li>
                    <li><strong>3 Colunas:</strong> Visão geral compacta, mostra mais gráficos simultaneamente</li>
                  </ul>
                </div>
                <p>
                  Você pode reorganizar os gráficos arrastando e soltando. Suas preferências são salvas automaticamente.
                </p>
              </div>
            </AccordionItem>

            <AccordionItem title="📅 Agendar Relatório">
              <div className="space-y-4">
                <p>
                  A função <strong>Agendar Relatório</strong> permite configurar envios automáticos de relatórios por email em horários específicos.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Funcionalidades:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Frequência:</strong> Diária, semanal ou mensal</li>
                    <li><strong>Horário:</strong> Defina o melhor horário para receber os relatórios</li>
                    <li><strong>Destinatários:</strong> Adicione múltiplos emails para receber os relatórios</li>
                    <li><strong>Formato:</strong> Escolha entre PDF, Excel ou ambos</li>
                    <li><strong>Filtros Aplicados:</strong> Os relatórios incluem os filtros atuais do dashboard</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Como Configurar:</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Configure os filtros desejados no dashboard</li>
                    <li>Clique em <strong>"Agendar Relatório"</strong></li>
                    <li>Defina a frequência e horário</li>
                    <li>Adicione os emails dos destinatários</li>
                    <li>Selecione o formato (PDF, Excel ou ambos)</li>
                    <li>Salve o agendamento</li>
                  </ol>
                </div>
                <p>
                  Você pode gerenciar, editar ou excluir agendamentos a qualquer momento através do painel de agendamentos.
                </p>
              </div>
            </AccordionItem>

            <AccordionItem title="🔗 Compartilhar">
              <div className="space-y-4">
                <p>
                  A função <strong>Compartilhar</strong> permite gerar links seguros para compartilhar o dashboard com outras pessoas, mantendo os filtros aplicados.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Funcionalidades:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Link Seguro:</strong> Gera um token único e seguro para acesso</li>
                    <li><strong>Filtros Preservados:</strong> O link mantém todos os filtros aplicados</li>
                    <li><strong>Validade:</strong> Links podem ter data de expiração configurável</li>
                    <li><strong>Pré-visualização:</strong> Visualize como o link será exibido antes de compartilhar</li>
                    <li><strong>WhatsApp:</strong> Compartilhe diretamente via WhatsApp com pré-visualização</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Como Usar:</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Configure os filtros desejados</li>
                    <li>Clique em <strong>"Compartilhar"</strong></li>
                    <li>Configure a validade do link (opcional)</li>
                    <li>Copie o link gerado ou compartilhe via WhatsApp</li>
                    <li>O link pode ser compartilhado com qualquer pessoa</li>
                  </ol>
                </div>
                <p>
                  <strong>Importante:</strong> Links compartilhados mostram uma versão somente leitura do dashboard com os filtros aplicados no momento da criação.
                </p>
              </div>
            </AccordionItem>

            <AccordionItem title="📥 Exportar">
              <div className="space-y-4">
                <p>
                  A função <strong>Exportar</strong> permite baixar os dados do dashboard em diferentes formatos para análise offline ou apresentações.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Formatos Disponíveis:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>PDF:</strong> Relatório completo com gráficos e tabelas formatados</li>
                    <li><strong>Excel:</strong> Dados brutos em planilhas para análise detalhada</li>
                    <li><strong>Imagem PNG:</strong> Captura de tela do dashboard atual</li>
                    <li><strong>CSV:</strong> Dados tabulares para importação em outras ferramentas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Opções de Exportação:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Seleção de Seções:</strong> Escolha quais seções incluir no export</li>
                    <li><strong>Filtros Aplicados:</strong> Os dados exportados respeitam os filtros ativos</li>
                    <li><strong>Gráficos:</strong> Inclua ou exclua gráficos específicos</li>
                    <li><strong>Tabelas:</strong> Exporte tabelas detalhadas com todos os dados</li>
                    <li><strong>Formatação:</strong> Personalize cores, logos e layout do PDF</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Como Exportar:</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Configure os filtros desejados</li>
                    <li>Clique em <strong>"Exportar"</strong></li>
                    <li>Selecione o formato desejado</li>
                    <li>Escolha quais seções incluir</li>
                    <li>Configure opções de formatação (para PDF)</li>
                    <li>Clique em <strong>"Baixar"</strong></li>
                  </ol>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="📈 Ver Análises">
              <div className="space-y-4">
                <p>
                  A função <strong>Ver Análises</strong> oferece análises avançadas e insights sobre os dados do dashboard.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Funcionalidades:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Análise Estatística:</strong> Médias, medianas, desvios padrão e tendências</li>
                    <li><strong>Comparações:</strong> Compare períodos, temporadas ou origens diferentes</li>
                    <li><strong>Insights Automáticos:</strong> O sistema identifica padrões e anomalias</li>
                    <li><strong>Recomendações:</strong> Sugestões baseadas nos dados analisados</li>
                    <li><strong>Drill-down:</strong> Navegue por níveis de detalhe dos dados</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Tipos de Análise:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Análise Temporal:</strong> Tendências ao longo do tempo</li>
                    <li><strong>Análise Comparativa:</strong> Comparação entre diferentes segmentos</li>
                    <li><strong>Análise de Performance:</strong> KPIs e métricas de desempenho</li>
                    <li><strong>Análise Preditiva:</strong> Projeções e previsões baseadas em dados históricos</li>
                  </ul>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="📊 Gráficos e Visualizações">
              <div className="space-y-4">
                <p>
                  O dashboard oferece diversos tipos de gráficos para visualizar seus dados de forma clara e eficiente.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Tipos de Gráficos Disponíveis:</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Gráfico de Linha:</strong> Ideal para mostrar tendências ao longo do tempo</li>
                    <li><strong>Gráfico de Barras:</strong> Compara valores entre diferentes categorias</li>
                    <li><strong>Gráfico de Área:</strong> Mostra a evolução cumulativa de valores</li>
                    <li><strong>Gráfico de Pizza:</strong> Representa proporções e percentuais</li>
                    <li><strong>Gráfico de Dispersão:</strong> Identifica correlações entre variáveis</li>
                    <li><strong>Heatmap:</strong> Visualiza dados em formato de matriz com cores</li>
                    <li><strong>Gauge:</strong> Mostra métricas em formato de medidor</li>
                    <li><strong>Treemap:</strong> Hierarquia de dados em formato de árvore</li>
                    <li><strong>Sunburst:</strong> Visualização hierárquica circular</li>
                    <li><strong>Boxplot:</strong> Análise estatística de distribuições</li>
                    <li><strong>Histograma:</strong> Distribuição de frequências</li>
                    <li><strong>Bubble Chart:</strong> Gráfico de bolhas com múltiplas dimensões</li>
                    <li><strong>Mapa:</strong> Visualização geográfica dos dados</li>
                    <li><strong>Correlograma:</strong> Matriz de correlações entre variáveis</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Navegação entre Gráficos:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Seletor de Tipo:</strong> Use o menu no topo de cada gráfico para alterar o tipo</li>
                    <li><strong>Arrastar e Soltar:</strong> Reorganize os gráficos arrastando-os para novas posições</li>
                    <li><strong>Minimizar/Maximizar:</strong> Clique no ícone de minimizar para economizar espaço</li>
                    <li><strong>Controles de Zoom:</strong> Use os controles para focar em períodos específicos</li>
                    <li><strong>Legendas Interativas:</strong> Clique nas legendas para mostrar/ocultar séries</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Interatividade:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Hover:</strong> Passe o mouse sobre os elementos para ver detalhes</li>
                    <li><strong>Clique:</strong> Clique em elementos para fazer drill-down</li>
                    <li><strong>Zoom:</strong> Use a roda do mouse ou gestos para dar zoom</li>
                    <li><strong>Pan:</strong> Arraste para navegar pelo gráfico</li>
                    <li><strong>Tooltips:</strong> Informações detalhadas aparecem ao interagir</li>
                  </ul>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="🎯 Presets de Filtros">
              <div className="space-y-4">
                <p>
                  Os <strong>Presets</strong> permitem salvar e reutilizar combinações de filtros frequentemente usadas.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Funcionalidades:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Presets Padrão:</strong> Presets pré-configurados como "Hoje", "Este Mês", "Último Trimestre"</li>
                    <li><strong>Presets Personalizados:</strong> Crie seus próprios presets com filtros específicos</li>
                    <li><strong>Aplicação Rápida:</strong> Aplique um preset com um único clique</li>
                    <li><strong>Edição:</strong> Modifique presets personalizados a qualquer momento</li>
                    <li><strong>Exclusão:</strong> Remova presets que não são mais necessários</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Como Criar um Preset:</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Configure os filtros desejados no dashboard</li>
                    <li>Clique no botão <strong>"Novo Preset"</strong> (ícone +)</li>
                    <li>Digite um nome descritivo para o preset</li>
                    <li>Os filtros atuais serão salvos automaticamente</li>
                    <li>Clique em <strong>"Criar Preset"</strong></li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Gerenciamento:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Editar:</strong> Clique no ícone de editar ao lado do preset selecionado</li>
                    <li><strong>Excluir:</strong> Clique no ícone de lixeira para remover um preset personalizado</li>
                    <li><strong>Presets Padrão:</strong> Não podem ser editados ou excluídos (protegidos)</li>
                    <li><strong>Seleção Automática:</strong> Ao criar um preset, ele é automaticamente aplicado</li>
                  </ul>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="🔍 Drill-Down e Navegação">
              <div className="space-y-4">
                <p>
                  O <strong>Drill-Down</strong> permite explorar os dados em diferentes níveis de detalhe, navegando de visões gerais para informações específicas.
                </p>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Como Funciona:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Clique em Elementos:</strong> Clique em barras, linhas ou pontos dos gráficos</li>
                    <li><strong>Navegação Automática:</strong> O dashboard filtra automaticamente para mostrar detalhes</li>
                    <li><strong>Breadcrumb:</strong> Veja o caminho de navegação no topo</li>
                    <li><strong>Voltar:</strong> Use o botão "Voltar" para retornar ao nível anterior</li>
                    <li><strong>Reset:</strong> Limpe toda a navegação e volte à visão inicial</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Níveis de Drill-Down:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Nível 1:</strong> Visão geral (todos os dados)</li>
                    <li><strong>Nível 2:</strong> Por categoria (ex: por origem, por SDR)</li>
                    <li><strong>Nível 3:</strong> Detalhamento específico (ex: leads individuais)</li>
                  </ul>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="💡 Dicas e Boas Práticas">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Performance:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Use filtros para reduzir a quantidade de dados carregados</li>
                    <li>Presets ajudam a acessar rapidamente visões comuns</li>
                    <li>Minimize gráficos não utilizados para melhor performance</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Análise Eficiente:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Comece com uma visão geral e use drill-down para detalhes</li>
                    <li>Compare períodos diferentes usando filtros e presets</li>
                    <li>Exporte dados para análise mais profunda em Excel</li>
                    <li>Compartilhe insights com a equipe usando a função de compartilhamento</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white nymu-dark:text-white">Personalização:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Organize os gráficos na ordem que faz mais sentido para você</li>
                    <li>Use diferentes layouts para diferentes tipos de análise</li>
                    <li>Crie presets para relatórios recorrentes</li>
                    <li>Ajuste temas e acessibilidade conforme sua preferência</li>
                  </ul>
                </div>
              </div>
            </AccordionItem>
          </div>
        </div>
      </div>
    </div>
  )
}

