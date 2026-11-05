'use strict';

const model = DirectorModel;
const programs = new Set(Object.values(PROGRAM_CATALOG).flat());
const storageKey = 'concilia-facultad-v1';
const $ = id => document.getElementById(id);
const format = new Intl.NumberFormat('es-CO', {maximumFractionDigits: 2});
const fmt = value => format.format(value);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const text = value => typeof value === 'string' ? value.trim() : '';
const periodKey = value => text(value).toUpperCase().replace(/\s*[-–—]\s*/g, '-');
const recordKey = record => JSON.stringify([record.program, record.period, record.id]);
const sum = (rows, key) => Number(rows.reduce((total, row) => total + row[key], 0).toFixed(10));

function validateRecord(record) {
  if (record?.schema !== 'concilia-director-1' || !text(record.id) ||
      !programs.has(record.program) || !text(record.director) || !periodKey(record.period) ||
      !Array.isArray(record.rows) || record.rows.length > 1000) {
    throw Error('El archivo debe incluir ID, programa, director, periodo y filas del registro de Concilia.');
  }
  const ids = new Set();
  const rows = record.rows.map(row => {
    if (!text(row?.id) || ids.has(row.id) || typeof row.course !== 'string' ||
        typeof row.teacher !== 'string' || model.numeric.some(field => row[field] !== null && !Number.isFinite(row[field]))) {
      throw Error('Hay filas con datos inválidos o identificadores repetidos.');
    }
    ids.add(row.id);
    return {id: row.id, course: row.course, teacher: row.teacher,
      ...Object.fromEntries(model.numeric.map(field => [field, row[field]]))};
  });
  return {schema: record.schema, id: text(record.id), program: record.program,
    director: text(record.director), period: periodKey(record.period), rows};
}

function parseCsv(source) {
  source = source.replace(/^\uFEFF/, '');
  const delimiter = source.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (source[i + 1] === '"') { field += '"'; i++; }
      else quoted = false;
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === delimiter || char === '\n' || char === '\r') {
      row.push(field);
      field = '';
      if (char !== delimiter) {
        if (row.some(cell => cell !== '')) rows.push(row);
        row = [];
        if (char === '\r' && source[i + 1] === '\n') i++;
      }
    } else field += char;
  }
  if (quoted) throw Error('El CSV tiene una celda entre comillas sin cerrar.');
  row.push(field);
  if (row.some(cell => cell !== '')) rows.push(row);
  return rows;
}

function recordsFromCsv(source) {
  const [header = [], ...rows] = parseCsv(source);
  const fields = {
    id: 'ID registro único', rowId: 'ID fila', director: 'Director responsable', program: 'Programa',
    period: 'Periodo', teacher: 'Profesor', course: 'Curso o actividad', credits: 'Créditos del curso',
    pct: 'Porcentaje del curso', works: 'Número de trabajos de grado',
    administration: 'Gestión administrativa h/semana', research: 'Investigación h/semana'
  };
  const indexes = Object.fromEntries(Object.entries(fields).map(([key, label]) =>
    [key, header.findIndex(cell => model.key(cell) === model.key(label))]));
  if (!rows.length || Object.values(indexes).some(index => index < 0)) {
    throw Error('Usa el CSV de Descargar registro de la app del director.');
  }
  const groups = new Map();
  for (const row of rows) {
    if (row.length !== header.length) throw Error('El CSV tiene filas con un número incorrecto de columnas.');
    const value = key => row[indexes[key]].replace(/^'(?=\s*[=+@\-\t\r])/, '');
    const id = text(value('id'));
    const metadata = {program: text(value('program')), director: text(value('director')), period: periodKey(value('period'))};
    const key = recordKey({id, ...metadata});
    if (!groups.has(key)) groups.set(key, {schema:'concilia-director-1', id, ...metadata, rows:[]});
    const record = groups.get(key);
    if (Object.keys(metadata).some(key => metadata[key] !== record[key])) {
      throw Error('El mismo ID de registro aparece con diferentes datos de programa, director o periodo.');
    }
    record.rows.push({id: text(value('rowId')), teacher: value('teacher'), course: value('course'),
      ...Object.fromEntries(model.numeric.map(field => {
        const cell = text(value(field));
        return [field, cell ? Number(cell.replace(',', '.')) : null];
      }))});
  }
  return [...groups.values()].map(validateRecord);
}

async function readFile(file) {
  if (file.size > 20_000_000) throw Error('El archivo supera el límite de 20 MB.');
  const source = await file.text();
  if (/\.csv$/i.test(file.name)) return recordsFromCsv(source);
  const data = JSON.parse(source);
  if (data.schema === storageKey && Array.isArray(data.records)) return data.records.map(validateRecord);
  return [validateRecord(data)];
}

let records = new Map();
let detailId = '';
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  records = new Map(saved.map(validateRecord).map(record => [recordKey(record), record]));
} catch {
  $('status').textContent = 'No fue posible recuperar la copia local. Puedes abrir una copia de facultad.';
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...records.values()]));
    return '';
  } catch {
    return 'El navegador no pudo guardar los cambios. Descarga una copia de facultad antes de cerrar.';
  }
}

function selectedRecords() {
  return [...records.values()].filter(record => record.period === $('period').value)
    .sort((a, b) => a.program.localeCompare(b.program, 'es') || a.director.localeCompare(b.director, 'es'));
}

function calculatePeriod(selected) {
  const teachers = new Map();
  const totals = new Map();
  for (const record of selected) {
    const rows = record.rows.filter(row => !model.error(row));
    totals.set(recordKey(record), rows.map(row => model.calculate(row, record.program)));
    for (const subtotal of model.summaries(rows, record.program)) {
      const key = model.key(subtotal.teacher);
      if (!teachers.has(key)) teachers.set(key, {teacher: subtotal.teacher, programs: new Set(), parts: []});
      const teacher = teachers.get(key);
      teacher.programs.add(record.program);
      teacher.parts.push(subtotal);
    }
  }
  const summary = [...teachers.values()].map(teacher => ({
    teacher: teacher.teacher,
    programs: [...teacher.programs].sort((a,b) => a.localeCompare(b,'es')),
    ...Object.fromEntries(['clase','preparation','thesis','administration','research','exact','weekly','exactSemester','semester']
      .map(key => [key, sum(teacher.parts, key)]))
  })).sort((a,b) => b.exact - a.exact || a.teacher.localeCompare(b.teacher,'es'));
  return {summary, totals};
}

const alert = teacher => teacher.exact > 40 ? 'Exceso decimal de ' + fmt(teacher.exact - 40) + ' h'
  : teacher.weekly > 40 ? 'Sobre 40 h solo con superior' : 'Dentro del límite';
const empty = (columns, message) => `<tr><td colspan="${columns}" class="faculty-empty">${message}</td></tr>`;

function render(previous = $('period').value) {
  const periods = [...new Set([...records.values()].map(record => record.period))]
    .sort((a,b) => b.localeCompare(a,'es',{numeric:true}));
  $('period').innerHTML = periods.length ? periods.map(period =>
    `<option>${escapeHtml(period)}</option>`).join('') : '<option value="">Sin registros</option>';
  if (periods.includes(previous)) $('period').value = previous;
  const selected = selectedRecords();
  const {summary, totals} = calculatePeriod(selected);
  const invalid = selected.reduce((count, record) => count + record.rows.length - totals.get(recordKey(record)).length, 0);
  const stats = [
    ['Programas', new Set(selected.map(record => record.program)).size, selected.length + ' registros cargados'],
    ['Profesores', summary.length, invalid + ' filas pendientes excluidas'],
    ['Horas semanales · decimal', sum(summary,'exact'), 'Superior ↑ ' + fmt(sum(summary,'weekly')) + ' h'],
    ['Profesores sobre 40 h', summary.filter(teacher => teacher.exact > 40).length,
      'Con superior ↑ ' + summary.filter(teacher => teacher.weekly > 40).length]
  ];
  $('stats').innerHTML = stats.map(([label,value,note]) =>
    `<div class="stat"><label>${label}</label><strong>${fmt(value)}</strong><small>${note}</small></div>`).join('');
  $('records').innerHTML = selected.map((record,index) => {
    const rows = totals.get(recordKey(record));
    const peers = selected.filter(other => other.program === record.program).length;
    return `<tr><td>${escapeHtml(record.program)}${peers > 1 ? '<br><span class="excess">Varios registros del programa</span>' : ''}</td>
    <td>${escapeHtml(record.director)}</td><td>${escapeHtml(record.id)}</td><td>${rows.length} / ${record.rows.length}</td>
    <td>${fmt(sum(rows,'exact'))}</td><td>${fmt(sum(rows,'weekly'))}</td>
    <td><button data-add="${index}">Agregar fila</button> <button data-view="${index}">Ver filas</button> <button data-remove="${index}">Retirar</button></td></tr>`;
  }).join('') || empty(7,'Carga los archivos de los programas para empezar.');
  $('summary').innerHTML = summary.map(teacher => `<tr><td>${escapeHtml(teacher.teacher)}</td>
    <td>${teacher.programs.map(escapeHtml).join('<br>')}</td><td>${fmt(teacher.exact)}</td><td>${fmt(teacher.weekly)}</td>
    <td>${fmt(teacher.exactSemester)}</td><td>${fmt(teacher.semester)}</td>
    <td>${teacher.weekly > 40 || teacher.exact > 40 ? '<span class="excess">' + alert(teacher) + '</span>' : alert(teacher)}</td></tr>`).join('')
    || empty(7,'El consolidado se genera con las filas completas del periodo seleccionado.');
  $('detail-csv').disabled = !summary.length;
  $('summary-csv').disabled = !summary.length;
  $('backup').disabled = !records.size;
  const detail = selected.find(record => recordKey(record) === detailId);
  $('detail').innerHTML = detail ? renderDetail(detail) : '';
}

function renderDetail(record) {
  const body = record.rows.map(row => {
    const error = model.error(row);
    const result = error ? null : model.calculate(row, record.program);
    return `<tr><td>${escapeHtml(row.teacher)}</td><td>${escapeHtml(row.course)}</td>
      <td>${result ? fmt(result.exact) : '—'}</td><td>${result ? fmt(result.weekly) : '—'}</td>
      <td>${escapeHtml(error || model.distribution(row,record.rows))}</td></tr>`;
  }).join('');
  return `<details open class="faculty-detail"><summary>${escapeHtml(record.program)} · ${escapeHtml(record.id)}</summary>
    <div class="summary-wrap"><table><thead><tr><th>Profesor</th><th>Curso o actividad</th><th>Decimal h/semana</th><th>Superior h/semana</th><th>Revisión</th></tr></thead>
    <tbody>${body || empty(5,'El registro está vacío.')}</tbody></table></div></details>`;
}

$('import').onclick = async () => {
  const files = [...$('files').files];
  if (!files.length) { $('status').textContent = 'Selecciona los archivos que deseas cargar.'; return; }
  $('import').disabled = true;
  const replace = $('replace').checked;
  let added = 0, replaced = 0, skipped = 0;
  const errors = [];
  try {
    for (const file of files) {
      try {
        for (const record of await readFile(file)) {
          const key = recordKey(record);
          if (!records.has(key)) added++;
          else if (replace) replaced++;
          else { skipped++; continue; }
          records.set(key, record);
        }
      } catch (error) { errors.push(file.name + ' — ' + error.message); }
    }
    const storageMessage = added || replaced ? save() : '';
    $('status').textContent = [`${added} agregados · ${replaced} reemplazados · ${skipped} repetidos omitidos`,
      ...errors, storageMessage].filter(Boolean).join('\n');
    $('files').value = '';
    render();
  } finally { $('import').disabled = false; }
};

$('period').onchange = () => { detailId = ''; render(); };
$('records').onclick = event => {
  const button = event.target.closest('button');
  if (!button) return;
  const selected = selectedRecords();
  if (button.dataset.add !== undefined) {
    openEntry(selected[Number(button.dataset.add)]);
  } else if (button.dataset.view !== undefined) {
    const record = selected[Number(button.dataset.view)];
    const key = recordKey(record);
    detailId = detailId === key ? '' : key;
    $('detail').innerHTML = detailId ? renderDetail(record) : '';
  } else {
    const record = selected[Number(button.dataset.remove)];
    if (!confirm('¿Retirar este registro de la facultad? Puedes volver a cargar su archivo.')) return;
    records.delete(recordKey(record));
    const message = save();
    $('status').textContent = ['Registro retirado del consolidado.', message].filter(Boolean).join('\n');
    render();
  }
};

$('entry-program').innerHTML = '<option value="">Selecciona el programa</option>' +
  Object.entries(PROGRAM_CATALOG).map(([group, names]) =>
    `<optgroup label="${escapeHtml(group)}">${names.map(name => `<option>${escapeHtml(name)}</option>`).join('')}</optgroup>`).join('');

function openEntry(record) {
  $('entry-form').reset();
  const selected = selectedRecords();
  $('entry-destination').innerHTML = '<option value="">Nuevo registro</option>' +
    selected.map(item =>
      `<option value="${escapeHtml(recordKey(item))}">${escapeHtml(item.program)} · ${escapeHtml(item.director)} · ${escapeHtml(item.id)}</option>`).join('');
  $('entry-destination').value = record ? recordKey(record) : '';
  $('entry-period').value = $('period').value;
  $('entry-error').textContent = '';
  updateEntry();
  $('entry-dialog').showModal();
}

function entryRecord() {
  return records.get($('entry-destination').value);
}

function entryRow() {
  return {teacher: text($('entry-teacher').value), course: text($('entry-course').value),
    ...Object.fromEntries(model.numeric.map(field => {
      const value = $('entry-' + field).value;
      return [field, value === '' ? null : Number(value)];
    }))};
}

function updateEntry() {
  const record = entryRecord();
  $('entry-new').hidden = $('entry-new').disabled = !!record;
  const program = record?.program || $('entry-program').value;
  const row = entryRow();
  const rule = ThesisRules.forProgram(program);
  const result = rule && !model.error(row) ? model.calculate(row, program) : null;
  $('entry-result').textContent = rule
    ? `Dirección de grado · ${rule.hours} h por trabajo y periodo.` +
      (result ? ` Total semanal · ${fmt(result.exact)} h decimal y ${fmt(result.weekly)} h superior.` : '')
    : 'Selecciona un programa para aplicar las horas de dirección de grado.';
}

$('add-row').onclick = () => openEntry(selectedRecords()[0]);
$('entry-cancel').onclick = () => $('entry-dialog').close();
$('entry-form').oninput = updateEntry;
$('entry-destination').onchange = updateEntry;
$('entry-form').onsubmit = event => {
  event.preventDefault();
  const existing = entryRecord();
  if ($('entry-destination').value && !existing) {
    $('entry-error').textContent = 'El registro de destino ya no está disponible.';
    return;
  }
  const row = entryRow();
  const issue = model.error(row);
  if (issue) { $('entry-error').textContent = issue; return; }
  try {
    const record = existing || {
      schema:'concilia-director-1', id:'REG-' + crypto.randomUUID(),
      program:$('entry-program').value, period:$('entry-period').value,
      director:$('entry-director').value, rows:[]
    };
    const updated = validateRecord({...record, rows:[...record.rows, {...row, id:crypto.randomUUID()}]});
    const key = recordKey(updated);
    records.set(key, updated);
    const message = save();
    detailId = key;
    $('entry-dialog').close();
    $('status').textContent = ['Fila agregada a ' + updated.program + '.', message].filter(Boolean).join('\n');
    render(updated.period);
  } catch (error) {
    $('entry-error').textContent = error.message;
  }
};

function download(data, filename, type) {
  const url = URL.createObjectURL(new Blob([data], {type}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const periodFilename = () => $('period').value.replace(/[^a-zA-Z0-9-]/g, '-');
$('summary-csv').onclick = () => {
  const {summary} = calculatePeriod(selectedRecords());
  const data = [['Periodo','Profesor','Programas','Clase h/semana','Preparación h/semana','Trabajos h/semana','Gestión h/semana','Investigación h/semana','Decimal h/semana','Superior h/semana','Decimal h/semestre','Superior h/semestre','Control de 40 horas'],
    ...summary.map(t => [$('period').value,t.teacher,t.programs.join(' | '),t.clase,t.preparation,t.thesis,t.administration,t.research,t.exact,t.weekly,t.exactSemester,t.semester,alert(t)])];
  download(model.csv(data), 'Consolidado-facultad-' + periodFilename() + '.csv', 'text/csv;charset=utf-8');
};
$('detail-csv').onclick = () => {
  const sheets = selectedRecords().map(record => model.exportRows({...record, rows: record.rows.filter(row => !model.error(row))}));
  if (!sheets.length) return;
  const [header] = sheets[0];
  download(model.csv([header, ...sheets.flatMap(sheet => sheet.slice(1))]),
    'Detalle-facultad-' + periodFilename() + '.csv', 'text/csv;charset=utf-8');
};
$('backup').onclick = () => download(JSON.stringify({schema:storageKey, records:[...records.values()]}, null, 2),
  'Copia-facultad.json', 'application/json');
render();
