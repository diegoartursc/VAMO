/**
 * Contrato de código do SearchModal.
 *
 * O projeto não tem runner de componentes (sem jest/RNTL), então o que dá pra
 * garantir automaticamente aqui é que o slider — e todo o resto que ele
 * arrastava junto — não volte por descuido. Os estados visuais em si foram
 * verificados no app rodando (web + viewport mobile).
 *
 *   npx tsx --test apps/mobile/src/components/search/searchModal.contract.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const modalSource = readFileSync(join(here, 'SearchModal.tsx'), 'utf8');

test('19. o Slider não é mais renderizado nem importado no SearchModal', () => {
    assert.ok(!modalSource.includes('@react-native-community/slider'), 'import do slider deve ter sumido');
    assert.ok(!/<Slider/.test(modalSource), 'não pode haver <Slider /> no JSX');
    assert.ok(!/\bstyles\.slider\b/.test(modalSource), 'estilos exclusivos do slider devem ter sumido');
    assert.ok(!/sliderRange/.test(modalSource), 'legenda de faixa do slider deve ter sumido');
});

test('20. os textos "1 dia" e "30 dias" do slider não aparecem mais', () => {
    assert.ok(!modalSource.includes('1 dia'), 'texto "1 dia" era do slider');
    assert.ok(!modalSource.includes('30 dias'), 'texto "30 dias" era do slider');
});

test('o componente DurationSlider foi removido do projeto', () => {
    assert.equal(existsSync(join(here, 'DurationSlider.tsx')), false);
});

test('o modal não guarda mais duração como número único', () => {
    assert.ok(!/setDuration\(/.test(modalSource), 'estado numérico de duração não existe mais');
    assert.ok(!/activeDurationChip/.test(modalSource), 'índice de chip solto não existe mais');
    assert.ok(!/Math\.round\(\(min \+ max\) \/ 2\)/.test(modalSource), 'nada de média de faixa');
    assert.ok(modalSource.includes('durationPreset'), 'o modal usa preset de faixa');
});

test('as opções de duração vêm da constante compartilhada, não de literais locais', () => {
    assert.ok(modalSource.includes('DURATION_PRESETS.map'), 'os chips renderizam a partir de DURATION_PRESETS');
    assert.ok(!modalSource.includes('DURATION_CHIPS'), 'a constante antiga não pode voltar');
});

test('24. todos os cabeçalhos de seção usam a mesma estrutura de ícone', () => {
    const headers = modalSource.match(/<FilterHeader\s+icon="[a-z-]+"\s+label="[^"]+"\s*\/>/g) ?? [];
    assert.equal(headers.length, 4, `esperava 4 cabeçalhos padronizados, achei ${headers.length}`);
    // Nenhum cabeçalho pode montar ícone + texto "na mão".
    assert.ok(!/filterLabelWithIcon/.test(modalSource), 'estrutura antiga de cabeçalho não pode sobrar');
    assert.ok(modalSource.includes('FILTER_HEADER_ICON_SIZE = 18'), 'tamanho único de ícone declarado uma vez');
});

test('cabeçalhos não usam emoji', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    const headerLines = modalSource
        .split('\n')
        .filter(line => line.includes('<FilterHeader'));
    for (const line of headerLines) {
        assert.ok(!emoji.test(line), `emoji em cabeçalho: ${line.trim()}`);
    }
});

test('a prévia de contagem usa a função pura compartilhada', () => {
    assert.ok(
        modalSource.includes('countMatchingItineraries'),
        'a contagem do rodapé precisa vir de searchUtils, não de lógica duplicada',
    );
    assert.ok(
        !modalSource.includes('filteredItineraries'),
        'a contagem não pode mais depender do resultado já aplicado no contexto',
    );
});
