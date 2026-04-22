# Task: Debug & Incident Resolution

## Incident Context
- **Symptom**: {{SHORT_DESCRIPTION}}
- **Severity**: {{BLOCKER|HIGH|MEDIUM|LOW}}
- **Module Affected**: {{TARGET_MODULE}}
- **Reported by**: {{USER_OR_SYSTEM}}

## Evidence & Reproduction
- **Logs/Error**: `{{ERROR_SNIPPET}}`
- **Environment**: {{PROD|STAGING|DEV}}
- **Version/Commit**: `{{COMMIT_HASH}}`
- **Reproduction Steps**:
  1. {{STEP_1}}
  2. {{STEP_2}}

## Root Cause Analysis (RCA)
- **Hypothesis**: {{WHAT_WE_THINK}}
- **Validation**: {{HOW_WE_PROVED_IT}}
- **Actual Cause**: {{THE_WHY}}

## Fix Strategy
```yaml
type: {{HOTFIX|BUGFIX|MITIGATION}}
entry_point: {{FILE_TO_CHANGE}}
side_effects: {{POTENTIAL_IMPACT}}
```

## Execution Steps

### Phase 1: Isolation
- [ ] Criar teste de regressão que falha em `{{TEST_PATH}}`
- [ ] Isolar estado do banco/cache em {{TEMP_DB}}

### Phase 2: Fix
- [ ] Aplicar correção em {{FILE_PATH}}
- [ ] Validar contra teste de regressão (deve passar agora)

### Phase 3: Verification
```bash
# Verificação local
{{TEST_COMMAND}}
{{INTEGRATION_CHECK}}
```

## Prevention & Follow-up
- [ ] Atualizar monitoramento/alertas em {{MONITOR_TOOL}}
- [ ] Documentar lição aprendida em {{POST_MORTEM_DOC}}
- [ ] Tech debt gerado? Registrar em {{DEBT_TICKET}}

## Definition of Done
- [ ] Causa raiz identificada e corrigida
- [ ] Teste de regressão adicionado e passando
- [ ] Logs limpos (sem erros residuais)
- [ ] Nenhuma regressão nos módulos vizinhos
