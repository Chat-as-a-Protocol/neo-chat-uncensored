# Task: Refactor

## Trigger Conditions
Marque o que iniciou este refactor:

- [ ] Code smell identificado: {{SMELL_TYPE}} (duplication | complexity | coupling | dead code)
- [ ] Performance issue: {{PERF_CONTEXT}}
- [ ] Tech debt ticket: {{DEBT_TICKET}}
- [ ] Pre-feature cleanup: {{FEATURE_REF}}

## Current State Mapping
```yaml
target_module: {{MODULE_PATH}}
entry_files: {{ENTRY_POINTS}}
export_surface: {{PUBLIC_API}}
consumer_count: {{NUM_CONSUMERS}}  # Quanto código depende disso?
```

## Safety Constraints
- **Behavior preservation**: output deve ser idêntico para inputs {{TEST_FIXTURES}}
- **No breaking changes** (ou explicitamente marcado em {{BREAKING_PLAN}})
- **Rollback**: commit {{PRE_REFACTOR_COMMIT}} como checkpoint seguro

## Execution Steps

### Phase 1: Isolation
- [ ] Extrair função/classe para {{TEMP_LOCATION}}
- [ ] Criar testes de caracterização se não existirem
- [ ] Verificar cobertura de teste em {{COVERAGE_TARGET}}%

### Phase 2: Transform
- [ ] Mover lógica para {{NEW_LOCATION}}
- [ ] Atualizar imports em {{MODULES_AFFECTED}}
- [ ] Renomear símbolos: {{OLD_NAME}} → {{NEW_NAME}}

### Phase 3: Verification
```bash
# Comandos de validação
{{TEST_COMMAND}}
{{TYPE_CHECK}}
{{LINT_COMMAND}}
{{INTEGRATION_TEST}}
```

## Risk Assessment
- **Impact radius**: {{HIGH|MEDIUM|LOW}}
- **Blast radius modules**: {{DEPENDENT_MODULES}}
- **Teammates to notify**: {{STAKEHOLDERS}}

## Post-Refactor
- [ ] Deletar código morto em {{DEAD_CODE_LOCATIONS}}
- [ ] Atualizar documentação em {{DOCS_TO_UPDATE}}
- [ ] Registrar em {{TECH_DEBT_LOG}}
