import { test, expect } from '@playwright/test';

test('Página inicial carrega corretamente', async ({ page }) => {
  // Acesse a URL do app (pode ser alterado para localhost em dev)
  await page.goto('https://noxai.chat');
  
  // Verifica se o título da página contém "NØX"
  await expect(page).toHaveTitle(/NØX/i);
  
  // Aqui você pode adicionar mais passos, como:
  // - Clicar em botões
  // - Preencher inputs
  // - Verificar se elementos do chat aparecem
});
