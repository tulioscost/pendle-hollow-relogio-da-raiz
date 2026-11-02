# Pendle Hollow — Relógio da Raiz

Módulo independente de sistema para **Foundry Virtual Tabletop**, criado para a parte final da aventura *Pendle Hollow*.

## Instalação pelo Foundry

Depois que a primeira release for publicada, use este manifesto em **Add-on Modules → Install Module → Manifest URL**:

```text
https://github.com/tulioscost/pendle-hollow-relogio-da-raiz/releases/latest/download/module.json
```

## Compatibilidade

- Foundry VTT: mínimo v13
- Verificado para: **v14.369**
- Sistema: independente; pode ser usado com Call of Cthulhu 7e ou outros sistemas
- Dependências: nenhuma

## Recursos

- Relógio/calendário diegético sempre visível para jogadores e GM.
- Exibe dia da semana, horário, dia da estadia (1–6) e contagem regressiva para a Festa.
- Somente o GM vê os controles.
- Alteração manual de dia, dia da semana e horário.
- Botões rápidos de ±10 minutos, ±1 hora e ±1 dia.
- Sincronização imediata por socket.
- Estado persistente no mundo.
- Relógio arrastável, com posição salva localmente por navegador.
- Aparência de madeira velha, galhos, ossos e sujeira.
- Intensificação visual nos dias 5 e 6.

## Estado inicial

- Quinta-feira
- Dia 4 / 6
- 08:00
- `A FESTA EM 2 DIAS`

## Uso pelo GM

Clique no botão de **caveira** no relógio. Selecione o dia da semana, o dia da estadia e o horário e pressione **ATUALIZAR PARA TODOS**.

## API para macros

```js
const clock = game.modules.get("pendle-hollow-final-clock").api;

await clock.setTime(3, 13);
await clock.setDay(5, "Sexta-feira");
await clock.setState({ stayDay: 6, weekday: "Sábado", hour: 22, minute: 0 });
```

Somente usuários GM podem alterar o estado pela API.

## Releases automáticas

O workflow `.github/workflows/release.yml` executa em todo push para `main` e lê a versão de `module.json`.

- Se `vX.Y.Z` **ainda não existir**, ele gera `pendle-hollow-final-clock.zip`, cria um `module.json` específico daquela versão e publica a release/tag automaticamente.
- Se a release da versão já existir, o workflow encerra sem duplicá-la.

### Como publicar uma nova versão

1. Altere `"version"` em `module.json`, por exemplo de `1.0.0` para `1.0.1`.
2. Faça commit e push para `main`.
3. O GitHub Actions cria automaticamente a tag e a Release `v1.0.1`.

Não é necessário criar a tag manualmente.

> Se o GitHub bloquear a publicação, confira em **Settings → Actions → General → Workflow permissions** se o `GITHUB_TOKEN` possui permissão **Read and write permissions**.


## HUD / Estante Antiga

A partir da versão **1.1.0**, o módulo também aplica um tema visual de cenário ao Foundry: a HUD lateral e os controles recebem acabamento de **madeira envelhecida**, com sensação de **estante antiga**, e as **mensagens de rolagem no chat** passam a lembrar **páginas de livros antigos**.


## Livro, fichário e chat

Na versão **1.1.1**, os Journals são apresentados com acabamento de **livro antigo aberto**. Os diretórios principais da sidebar assumem aparência de **tomos e fichário antigo**, preservando nomes, ícones e usabilidade do Foundry.

O chat usa as categorias nativas do Foundry VTT v14 para diferenciar visualmente:
- **fala em personagem (IC)** — página de romance;
- **emote** — anotação manuscrita;
- **fora de personagem (OOC)** — ficha pautada;
- **rolagens** — página arrancada / registro ritual;
- **mensagens genéricas** — pergaminho neutro.
