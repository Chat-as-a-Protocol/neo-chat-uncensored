# SVG banner

Workspace raiz **multi-repo** do ecossistema NEØ PROTOCOL — pasta no disco onde convivem **várias organizações e clones** (cada um com o seu `.git`), não um monorepo único.

## NEO-PROTOCOL: pasta local e organização GitHub

Tarefa: gerar um banner SVG para o README do projeto onde estás a trabalhar,
seguindo o mesmo padrão visual do banner de referência abaixo.

Output:

- Um único ficheiro SVG, salvo em `docs/assets/<nome-do-projeto>-banner.svg`.
- Inserir no README, próximo do título, com:

      ![<nome-do-projeto> banner](./docs/assets/<nome-do-projeto>-banner.svg>)

Especificações fixas (não mudar):

- viewBox 1200x420, width="1200", height="420".
- Fundo externo sólido + cartão interno com cantos arredondados (rx=24) e
  gradiente linear diagonal entre dois tons escuros próximos.
- Paleta base estilo "terminal escuro":
    fundo:        #09131A
    cartão grad:  #10222D -> #0B151C
    ciano:        #6EE7F9 (linhas, borda, label superior)
    lima/accent:  #D7FF64 (núcleo, títulos de bloco, highlights)
    texto claro:  #E8F4F8
    texto suave:  #9BB7C3
- Tipografia: usar font-family monoespaçada
  (ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace).
- Manter a "linguagem" de blocos:
    1) À esquerda: símbolo circular concêntrico (3 círculos) representando o
       núcleo/identidade do projeto.
    2) 3 linhas finas ciano ligando o símbolo a um primeiro cartão.
    3) Primeiro cartão: lista de 3 "funções" principais do projeto em estilo
       código, ex: foo(), bar(), baz(). A primeira linha em accent (#D7FF64),
       as outras em texto claro.
    4) Seta ciano curta ligando o primeiro cartão a um segundo cartão maior.
    5) Segundo cartão: título em accent (caixa alta, ex: NOME DO DOMÍNIO) e
       3 linhas de descrição curta dos conceitos centrais.

- Rodapé/topo do banner:

  - Topo esquerdo: label pequeno em ciano com letter-spacing (ex: nome da
      organização ou família do projeto).
  - Inferior esquerdo: nome do projeto em fonte grande bold (~44px) e,
      por baixo, uma frase curta (uma linha) em texto suave descrevendo o que
      o projeto faz.

O que adaptar ao projeto atual:

- Substituir "NEO PROTOCOL" pelo nome da organização/família do projeto.
- Substituir "neo-mcp-server" pelo nome real do projeto.
- Substituir a tagline pela descrição real (uma linha, em inglês ou no idioma
  do README do projeto).
- Substituir identity()/upload()/retrieve() pelas 3 capacidades/funções
  principais do projeto.
- Substituir "STORACHA SPACE" e as 3 linhas seguintes pelos 3 conceitos
  centrais do domínio do projeto.
- Pode trocar o accent (#D7FF64) por outra cor da identidade visual do
  projeto, mantendo bom contraste no fundo escuro.

SVG de referência (estrutura a imitar):

<colar aqui o conteúdo do ficheiro
 docs/assets/neo-mcp-server-banner.svg deste repo>

Restrições:

    - SVG estático, sem animações, sem dependências externas, sem <image>
    - Tudo em vetor, texto como <text> (não converter para path).
    - Manter os IDs e <defs> coerentes; nada de fontes externas.
    - Não inventar logos de marcas terceiras
