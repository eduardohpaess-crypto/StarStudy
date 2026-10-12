# StarStudy — Sistema Operacional Acadêmico Inteligente

O **StarStudy** é uma plataforma universitária de organização acadêmica, produtividade e aprendizagem ativa personalizada com inteligência artificial via **Gemini 3.8 Flash** e **persistência local no navegador**.

---

## 🌟 Principais Funcionalidades

### 1. Visão Geral & Métricas
- **Dashboard Acadêmico Completo**: tempo estudado no dia e na semana, metas configuráveis, sequência de dias (streak de constância), tarefas pendentes e atrasadas, revisões previstas para hoje, próximas avaliações, média geral ponderada (CR) e créditos acumulados.
- **Gráfico de Atividade de 7 Dias**: minutos estudados dia a dia.
- **Mapa de Constância de 12 Semanas**: visualização de regularidade diária no estilo heatmap.
- **Feed Acadêmico Dinâmico**: feed unificado com alertas de revisões vencidas, provas agendadas, prazos próximos e metas.
- **O Que Estudar Agora (Motor Determinístico)**: algoritmo que calcula pontuação de 0 a 100 ponderando proximidade de provas, domínio atual, revisões atrasadas, dificuldade e prioridade da disciplina.

### 2. Gestão Acadêmica & Disciplinas
- **Matérias & Conteúdos**: cadastro completo com professor, horários, créditos, notas mínimas, cores, tópicos e provas.
- **Modo Universidade**: visualização da trajetória semestral, créditos integralizados e percentual de conclusão do curso.
- **Calculadora de Notas & Simulação**: calculadora ponderada com simulação "Quanto preciso tirar nas próximas provas para passar?".

### 3. Produtividade & Métodos de Estudo
- **Quadro Kanban de Tarefas**: colunas *A Fazer*, *Fazendo* e *Concluído*, prazos, categorias e alertas visuais de atraso.
- **Cronômetro Pomodoro Anti-Drift**: ciclos clássico (25/5 min), longo (50/10 min) e estendido (90/20 min), baseados em timestamps reais contra drift e acúmulo de XP.
- **Hábitos & Notas Rápidas**: rastreador de hábitos com streaks diários/semanais e bloco de notas com busca instantânea e fixação (pin).
- **Vídeos de Estudo**: videoteca segura de videoaulas do YouTube organizadas por disciplina.

### 4. Aprendizagem Ativa & Inteligência Artificial
- **Revisão Espaçada (Active Recall)**: algoritmo SuperMemo (SM-2) com 5 níveis de avaliação da lembrança e cálculo de intervalos adaptativos.
- **Flashcards com Animação 3D**: baralhos com frente e verso, modo de estudo interativo e exportação em CSV compatível com **Anki**.
- **Simulados com Correção Automática**: testes de 5, 10, 15 ou 20 questões de múltipla escolha com cronômetro, diagnóstico de desempenho e gabarito comentado.
- **As 20 Ferramentas de IA**:
  1. Resumo Inteligente
  2. Mapa Mental
  3. Questões Dissertativas com gabarito
  4. Explicação Simples (Técnica Feynman)
  5. Quiz Relâmpago (5 questões)
  6. Cronograma de Revisão de 14 Dias
  7. Análise de Desempenho e Dificuldades
  8. Plano de Preparação para Prova
  9. Previsão de Nota e Riscos
  10. Recomendação de Método de Estudo
  11. Geração de Flashcards
  12. Conexões Interdisciplinares
  13. Roteiro Educativo para Podcast
  14. Analogias Criativas
  15. Mnemônicos e Siglas
  16. Planejamento de 4 Semanas
  17. Correção de Pontos Fracos e Pegadinhas
  18. Glossário Acadêmico
  19. Fórmulas e Conceitos Essenciais
  20. Simulado Completo Comentado
- **Biblioteca IA**: repositório offline de materiais salvos com pesquisa textual e leitor integrado.
- **Planejador em Linguagem Natural**: interpreta rotinas digitadas em texto comum e propõe blocos de estudo estruturados com confirmação explícita.
- **Importação de Materiais**: extração assistida por IA e modo estruturado manual para ementas e apostilas.

### 5. Soberania, Privacidade & Sincronização em Nuvem
- **Firebase Authentication & Firestore**: login com Google via popup (`signInWithPopup`) e sincronização dos dados acadêmicos na nuvem em tempo real (`users/{userId}/...`).
- **Armazenamento Híbrido**: funciona tanto offline no navegador (IndexedDB e LocalStorage) quanto sincronizado com o Firebase Firestore quando autenticado.
- **Regras de Segurança Hardened (`firestore.rules`)**: regras implementadas e implantadas no Firestore garantindo isolamento total por usuário (`isOwner(userId)`).
- **Backup e Restauração em JSON**: exportação e importação completas em JSON sem incluir credenciais.

---

## 🚀 Como Executar no Google AI Studio

1. O projeto roda através do dev server:
   ```bash
   npm run dev
   ```
2. O servidor Express monta a API e os middlewares do Vite na porta 3000.
3. Para ativar recursos automáticos do Gemini, configure o segredo `GEMINI_API_KEY` no painel **Settings > Secrets**.
4. Todas as ferramentas também dispõem de **Modo Manual**, permitindo uso completo mesmo offline.

---

## 📦 Sincronização com GitHub

Para sincronizar este projeto com seu GitHub pelo Google AI Studio Build:
1. No painel superior do Google AI Studio, clique em **Export to GitHub** ou **Git Sync**.
2. Conecte sua conta do GitHub e escolha o repositório de destino.
3. As variáveis e chaves de API (`GEMINI_API_KEY`) nunca são incluídas no repositório versionado, preservando sua segurança.
