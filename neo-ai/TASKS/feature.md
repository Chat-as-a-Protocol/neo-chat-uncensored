# Task: Feature Development

## Input Required

- [ ] User story em {{STORY_FORMAT}}
- [ ] Module afetado: {{TARGET_MODULE}}
- [ ] Breaking change? {{YES_NO}}

## Pre-Flight Checklist

- [ ] Revi `WORKSPACE.md` para entender vizinhos
- [ ] Revi `CONSTRAINTS.md` para limites
- [ ] Identifiquei tests existentes em `{{TEST_PATTERN}}`

## Execution Context

```yaml
scope: {{SCOPE_BOUNDARY}}
entry_point: {{ENTRY_FILE}}
expected_output: {{OUTPUT_CONTRACT}}
side_effects: {{ALLOWED_SIDE_EFFECTS}}
```

## Definition of Done

- [ ] Implementação em {{MODULE_PATH}}
- [ ] Testes em {{TEST_PATH}}
- [ ] Documentação em {{DOCS_PATH}}
- [ ] Não quebrou {{HEALTH_CHECK}}
